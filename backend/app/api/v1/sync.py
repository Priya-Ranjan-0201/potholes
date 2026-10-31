"""Sync Batch ingestion API endpoint for edge devices."""

from __future__ import annotations

from typing import Any

from backend.app.db.session import get_db
from backend.app.models.auth import AuditLog
from backend.app.models.device import Device
from backend.app.models.ml import Inspection, Media
from backend.app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from backend.app.services.dedup import DeduplicationService
from backend.app.services.roads import RoadService
from backend.app.services.severity import SeverityService
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

dedup_service = DeduplicationService()
road_service = RoadService()
severity_service = SeverityService()


@router.post(
    "/sync",
    response_model=SyncBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest batch of defect observations from edge outbox",
    description=(
        "Idempotent batch upload of consolidated road defects, media manifests, and telemetry."
    ),
)
async def ingest_sync_batch(
    batch: SyncBatchRequest,
    x_idempotency_key: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> SyncBatchResponse:
    """Ingest a batch of defect observations with spatial deduplication and idempotency."""
    effective_idempotency_key = x_idempotency_key or batch.idempotency_key

    # 1. Idempotency Check (Rule B4)
    stmt = select(AuditLog).where(
        AuditLog.action == "SYNC_BATCH_INGESTED",
        AuditLog.entity_id == effective_idempotency_key,
    )
    existing_log = (await db.execute(stmt)).scalar_one_or_none()

    if existing_log is not None and existing_log.payload_diff:
        cached_data = existing_log.payload_diff
        return SyncBatchResponse(
            status="ALREADY_PROCESSED",
            batch_id=batch.batch_id,
            idempotency_key=effective_idempotency_key,
            total_received=len(batch.observations),
            synced_observations=int(
                cached_data.get("synced_observations", len(batch.observations))
            ),
            new_defects=int(cached_data.get("new_defects", 0)),
            merged_defects=int(cached_data.get("merged_defects", 0)),
            media_registered=int(cached_data.get("media_registered", len(batch.media_manifest))),
            message="Batch previously processed (idempotent replay)",
        )

    # 2. Ensure Device Registration / Auto-Enrollment
    device_stmt = select(Device).where(Device.id == batch.device_id)
    device = (await db.execute(device_stmt)).scalar_one_or_none()
    if device is None:
        device = Device(
            id=batch.device_id,
            device_key=f"dev-{batch.device_id}",
            device_type="android",
            model_name="OPPO K13",
            active_model_version=batch.model_version or "scamroad-yolov8n-v1.0",
            is_active=True,
        )
        db.add(device)
        await db.flush()

    # 3. Handle Inspection Session (if present)
    inspection_id = None
    if batch.inspection_metadata and batch.inspection_metadata.inspection_id:
        inspection_id = batch.inspection_metadata.inspection_id
        insp_stmt = select(Inspection).where(Inspection.id == inspection_id)
        inspection = (await db.execute(insp_stmt)).scalar_one_or_none()
        if inspection is None:
            inspection = Inspection(
                id=inspection_id,
                device_id=batch.device_id,
                title="Automated Road Inspection Run",
                status="IN_PROGRESS",
            )
            db.add(inspection)
            await db.flush()

    # 4. Register Media Manifest
    media_registered_count = 0
    for media_item in batch.media_manifest:
        media_stmt = select(Media).where(Media.sha256_hash == media_item.sha256)
        existing_media = (await db.execute(media_stmt)).scalar_one_or_none()
        if existing_media is None:
            new_media = Media(
                id=media_item.media_id,
                inspection_id=inspection_id,
                storage_path=f"data/backend_media/{media_item.filename}",
                mime_type=media_item.mime_type,
                sha256_hash=media_item.sha256,
                size_bytes=media_item.size_bytes,
                is_privacy_blurred=True,  # Redacted on-device before sync (Rule R15)
            )
            db.add(new_media)
            media_registered_count += 1

    # 5. Process Observations with Spatial Snapping & Deduplication
    new_defects_count = 0
    merged_defects_count = 0

    for obs in batch.observations:
        obs_dict = obs.model_dump()

        # Step 5a: Snap to Road Segment
        snapped = await road_service.snap_to_road_segment(
            db, obs.location.latitude, obs.location.longitude
        )
        segment_id = snapped.segment_id if snapped else None

        # Step 5b: Deduplicate & Merge into Canonical Defect
        canonical_defect, _obs_record, is_merged, _merge_log = (
            await dedup_service.process_observation(
                session=db,
                obs_data=obs_dict,
                device_id=batch.device_id,
                road_segment_id=segment_id,
            )
        )

        if is_merged:
            merged_defects_count += 1
        else:
            new_defects_count += 1

        # Step 5c: Compute and Record Severity Assessment
        rel_area = obs.measurement_summary.relative_area if obs.measurement_summary else None
        await severity_service.assess_and_record(
            session=db,
            defect=canonical_defect,
            confidence=obs.confidence,
            relative_area=rel_area,
            track_frames=obs.track_length_frames,
            source="auto",
        )

    # 6. Record Ingestion Audit Trail for Idempotency
    summary_diff: dict[str, Any] = {
        "batch_id": str(batch.batch_id),
        "device_id": str(batch.device_id),
        "synced_observations": len(batch.observations),
        "new_defects": new_defects_count,
        "merged_defects": merged_defects_count,
        "media_registered": media_registered_count,
    }

    audit = AuditLog(
        action="SYNC_BATCH_INGESTED",
        entity_type="sync_batch",
        entity_id=effective_idempotency_key,
        payload_diff=summary_diff,
    )
    db.add(audit)

    await db.commit()

    return SyncBatchResponse(
        status="SYNCED",
        batch_id=batch.batch_id,
        idempotency_key=effective_idempotency_key,
        total_received=len(batch.observations),
        synced_observations=len(batch.observations),
        new_defects=new_defects_count,
        merged_defects=merged_defects_count,
        media_registered=media_registered_count,
        message="Batch successfully ingested with spatial deduplication",
    )

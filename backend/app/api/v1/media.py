"""Media upload and integrity verification API endpoints."""

from __future__ import annotations

import hashlib
import uuid
from pathlib import Path

from backend.app.db.session import get_db
from backend.app.models.ml import Media
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

MEDIA_STORAGE_DIR = Path("data/backend_media")


class MediaUploadResponse(BaseModel):
    """Response confirming media receipt and verification."""

    media_id: uuid.UUID
    sha256: str
    size_bytes: int
    storage_path: str
    is_privacy_blurred: bool
    status: str


def validate_image_magic_bytes(header: bytes) -> str:
    """Validate image magic bytes and return extension."""
    if header.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported or corrupt image format. Only JPEG and PNG are allowed.",
    )


@router.post(
    "/upload",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload privacy-redacted defect media frame",
    description=(
        "Uploads media frame, verifies SHA-256 hash match against edge manifest, "
        "and stores asset."
    ),
)
async def upload_media(
    file: UploadFile = File(...),
    media_id: uuid.UUID = Form(...),
    sha256_hash: str = Form(...),
    device_id: uuid.UUID | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
) -> MediaUploadResponse:
    """Ingest and verify on-device blurred media."""
    content = await file.read()
    size_bytes = len(content)

    if size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    # 1. Verify SHA-256 Checksum
    computed_sha256 = hashlib.sha256(content).hexdigest().lower()
    expected_sha256 = sha256_hash.strip().lower()

    if computed_sha256 != expected_sha256:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"Media SHA-256 checksum mismatch. Expected {expected_sha256}, "
                f"computed {computed_sha256}."
            ),
        )

    # 2. Validate Magic Bytes
    ext = validate_image_magic_bytes(content[:16])

    # 3. Store to disk
    MEDIA_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    target_path = MEDIA_STORAGE_DIR / f"{media_id}{ext}"
    target_path.write_bytes(content)

    # 4. Update or Insert Media record in DB
    stmt = select(Media).where((Media.id == media_id) | (Media.sha256_hash == computed_sha256))
    existing_media = (await db.execute(stmt)).scalar_one_or_none()

    if existing_media is not None:
        existing_media.storage_path = str(target_path)
        existing_media.size_bytes = size_bytes
    else:
        new_media = Media(
            id=media_id,
            storage_path=str(target_path),
            mime_type=file.content_type or "image/jpeg",
            sha256_hash=computed_sha256,
            size_bytes=size_bytes,
            is_privacy_blurred=True,
        )
        db.add(new_media)

    await db.commit()

    return MediaUploadResponse(
        media_id=media_id,
        sha256=computed_sha256,
        size_bytes=size_bytes,
        storage_path=str(target_path),
        is_privacy_blurred=True,
        status="UPLOADED",
    )

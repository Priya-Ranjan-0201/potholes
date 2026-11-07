#!/usr/bin/env python3
"""Comprehensive demonstration database seeder for ScamRoad (Section 7, v10).

Populates 80-120 defects, 25-35 work orders, and 20 citizen reports across 45 days.
All rows are marked with is_demo=True.
Supports `--reset` to drop previous demo records.
"""

from __future__ import annotations

import argparse
import logging
import random
from datetime import UTC, datetime, timedelta

from backend.app.core.security import hash_password
from backend.app.db.session import sync_engine
from backend.app.models.analytics import Notification, WeatherRecord
from backend.app.models.auth import Role, User, UserRole
from backend.app.models.complaint import CitizenReport, Complaint, ComplaintStatusHistory
from backend.app.models.defect import (
    Defect,
    DefectObservation,
    RoadHealthScore,
    SeverityAssessment,
)
from backend.app.models.device import Device
from backend.app.models.geo import District, Road, RoadSegment, Ward
from backend.app.models.maintenance import (
    BudgetAllocation,
    Contractor,
    RepairRecord,
    RepairVerification,
    SlaPolicy,
    WorkOrder,
    WorkOrderHistory,
)
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scamroad.seed")

CORRIDORS = [
    ("NH-44 Grand Trunk Corridor", "NH44-GT", "SRID=4326;LINESTRING(75.8300 30.9100, 75.8600 30.9250, 75.8900 30.9400)"),
    ("Outer Ring Road", "ORR-01", "SRID=4326;LINESTRING(75.8100 30.8700, 75.8400 30.8800, 75.8700 30.8900)"),
    ("SV Industrial Expressway", "SVE-02", "SRID=4326;LINESTRING(75.8700 30.8800, 75.8950 30.8950, 75.9200 30.9100)"),
    ("GST Metro Boulevard", "GST-03", "SRID=4326;LINESTRING(75.8200 30.8900, 75.8400 30.9000, 75.8600 30.9100)"),
    ("Central Civil Lines", "CCL-04", "SRID=4326;LINESTRING(75.8400 30.9000, 75.8500 30.9080, 75.8650 30.9150)"),
]

def reset_demo_data(session: Session) -> None:
    logger.info("Dropping existing demo data...")
    # Delete dependent tables first
    session.execute(delete(RepairVerification))
    session.execute(delete(RepairRecord))
    session.execute(delete(WorkOrderHistory))
    session.execute(delete(WorkOrder).where(WorkOrder.is_demo == True))
    session.execute(delete(ComplaintStatusHistory))
    session.execute(delete(Complaint).where(Complaint.is_demo == True))
    session.execute(delete(CitizenReport).where(CitizenReport.is_demo == True))
    session.execute(delete(DefectObservation))
    session.execute(delete(SeverityAssessment))
    session.execute(delete(Defect).where(Defect.is_demo == True))
    session.commit()
    logger.info("Demo data reset completed.")

def seed_demo_data(reset: bool = False) -> None:
    random.seed(42)
    logger.info("Starting ScamRoad demonstration database seeder...")

    with Session(sync_engine) as session:
        if reset:
            reset_demo_data(session)

        # 1. Users & Roles
        pw_hash = hash_password("ScamRoad2026!")
        roles_map: dict[str, Role] = {}
        for r_name in ["admin", "engineer", "contractor", "citizen"]:
            r = session.scalar(select(Role).where(Role.name == r_name))
            if not r:
                r = Role(name=r_name, description=f"{r_name.capitalize()} platform role")
                session.add(r)
                session.flush()
            roles_map[r_name] = r

        admin_user = session.scalar(select(User).where(User.email == "admin@scamroad.local"))
        if not admin_user:
            admin_user = User(
                email="admin@scamroad.local",
                password_hash=pw_hash,
                full_name="Municipal Chief Engineer",
                phone="+91-98765-43210",
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
            session.flush()
            session.add(UserRole(user_id=admin_user.id, role_id=roles_map["admin"].id))
            session.add(UserRole(user_id=admin_user.id, role_id=roles_map["engineer"].id))

        # 2. District & Wards
        district = session.scalar(select(District).where(District.name == "Central Municipal District"))
        if not district:
            district = District(name="Central Municipal District", state="Punjab")
            session.add(district)
            session.flush()

        wards: list[Ward] = []
        for i, name in enumerate(["North Ward (W-01)", "East Industrial (W-02)", "South Transit (W-03)", "West Heritage (W-04)", "Central Ward (W-05)"], 1):
            w = session.scalar(select(Ward).where(Ward.district_id == district.id, Ward.ward_number == i))
            if not w:
                w = Ward(
                    district_id=district.id,
                    name=name,
                    ward_number=i,
                )
                session.add(w)
                session.flush()
            wards.append(w)

        # 3. Roads & RoadSegments
        segments: list[RoadSegment] = []
        for i, (name, code, geom_wkt) in enumerate(CORRIDORS):
            road = session.scalar(select(Road).where(Road.road_code == code))
            if not road:
                road = Road(
                    ward_id=wards[i % len(wards)].id,
                    name=name,
                    road_code=code,
                    geometry=geom_wkt,
                )
                session.add(road)
                session.flush()

            seg = session.scalar(select(RoadSegment).where(RoadSegment.road_id == road.id))
            if not seg:
                seg = RoadSegment(
                    road_id=road.id,
                    segment_index=1,
                    length_meters=2400.0,
                    geometry=geom_wkt,
                )
                session.add(seg)
                session.flush()
            segments.append(seg)

        # Ensure we use ALL road segments across all wards in the database
        all_segments = session.scalars(select(RoadSegment)).all()
        if all_segments:
            segments = all_segments

        # Ensure BudgetAllocations exist for all wards
        for w in session.scalars(select(Ward)).all():
            existing_b = session.scalar(select(BudgetAllocation).where(BudgetAllocation.ward_id == w.id))
            if not existing_b:
                session.add(
                    BudgetAllocation(
                        ward_id=w.id,
                        fiscal_year="2025-2026",
                        allocated_amount=5000000.0,
                        spent_amount=round(random.uniform(1200000.0, 2400000.0), -3),
                    )
                )

        # 4. Contractors & SLA Policies
        sla_crit = session.scalar(select(SlaPolicy).where(SlaPolicy.severity_level == "Critical"))
        if not sla_crit:
            sla_crit = SlaPolicy(name="Critical 24h SLA", severity_level="Critical", max_resolution_hours=24)
            session.add(sla_crit)
            session.flush()

        sla_sev = session.scalar(select(SlaPolicy).where(SlaPolicy.severity_level == "Severe"))
        if not sla_sev:
            sla_sev = SlaPolicy(name="Severe 48h SLA", severity_level="Severe", max_resolution_hours=48)
            session.add(sla_sev)
            session.flush()

        sla_mod = session.scalar(select(SlaPolicy).where(SlaPolicy.severity_level == "Moderate"))
        if not sla_mod:
            sla_mod = SlaPolicy(name="Moderate 72h SLA", severity_level="Moderate", max_resolution_hours=72)
            session.add(sla_mod)
            session.flush()

        sla_min = session.scalar(select(SlaPolicy).where(SlaPolicy.severity_level == "Minor"))
        if not sla_min:
            sla_min = SlaPolicy(name="Minor 168h SLA", severity_level="Minor", max_resolution_hours=168)
            session.add(sla_min)
            session.flush()

        sla_map = {
            "Critical": sla_crit,
            "Severe": sla_sev,
            "Moderate": sla_mod,
            "Minor": sla_min,
        }

        contractors: list[Contractor] = []
        for c_name, c_person, c_phone in [
            ("Apex Pavement Infra Ltd", "Er. Rajesh Kumar", "+91-98765-01001"),
            ("National Highway Works Corp", "Er. Gurpreet Singh", "+91-98765-01002"),
            ("Metro Road Services", "Er. Aman Verma", "+91-98765-01003"),
            ("Civic Bitumen Specialists", "Er. Priya Sen", "+91-98765-01004"),
        ]:
            c = session.scalar(select(Contractor).where(Contractor.name == c_name))
            if not c:
                c = Contractor(
                    name=c_name,
                    contact_person=c_person,
                    phone=c_phone,
                    is_active=True,
                )
                session.add(c)
                session.flush()
            contractors.append(c)

        # 5. Device
        device = session.scalar(select(Device).where(Device.device_key == "EDGE-CAM-01"))
        if not device:
            device = Device(
                device_key="EDGE-CAM-01",
                model_name="Mobile Edge Surveyor",
                device_type="android",
                is_active=True,
                active_model_version="scamroad-yolo11n-int8",
            )
            session.add(device)
            session.flush()

        # 6. Generate 110 Realistic Defects distributed across ALL road segments in ALL wards
        now = datetime.now(UTC)
        classes = ["POTHOLE"] * 60 + ["CRACK_ALLIGATOR"] * 24 + ["CRACK_LONG"] * 16 + ["CRACK_TRANS"] * 10
        random.shuffle(classes)

        created_defects: list[Defect] = []
        base_lat, base_lon = 30.9010, 75.8570

        defect_levels: list[str] = []
        for i, code in enumerate(classes):
            days_ago = random.randint(1, 45)
            hours_ago = random.randint(0, 23)
            seen_time = now - timedelta(days=days_ago, hours=hours_ago)
            seg = segments[i % len(segments)]

            lat_jitter = (random.random() - 0.5) * 0.04
            lon_jitter = (random.random() - 0.5) * 0.04
            lat = base_lat + lat_jitter
            lon = base_lon + lon_jitter
            loc_wkt = f"SRID=4326;POINT({lon:.6f} {lat:.6f})"

            # Realistic score distribution
            if code == "POTHOLE":
                score = round(random.uniform(40.0, 95.0), 1)
            elif code == "CRACK_ALLIGATOR":
                score = round(random.uniform(50.0, 85.0), 1)
            else:
                score = round(random.uniform(20.0, 65.0), 1)

            if score >= 76:
                level = "Critical"
            elif score >= 51:
                level = "Severe"
            elif score >= 26:
                level = "Moderate"
            else:
                level = "Minor"

            times_seen = random.randint(1, 8)
            status = random.choice(["ACTIVE", "ACTIVE", "IN_REPAIR", "REPAIRED"])

            defect = Defect(
                class_code=code,
                location=loc_wkt,
                road_segment_id=seg.id,
                status=status,
                times_seen=times_seen,
                first_seen=seen_time - timedelta(days=random.randint(0, 5)),
                last_seen=seen_time,
                is_demo=True,
                created_at=seen_time,
            )
            session.add(defect)
            session.flush()

            sev = SeverityAssessment(
                defect_id=defect.id,
                raw_score=score,
                normalized_score=score,
                level=level,
                factor_breakdown={"base": round(score * 0.7, 1), "area_pct": round(score * 0.05, 1)},
                missing_factors=[],
                needs_human_review=(level == "Critical"),
                source="auto",
                created_at=seen_time,
            )
            session.add(sev)

            obs = DefectObservation(
                defect_id=defect.id,
                device_id=device.id,
                location=loc_wkt,
                gps_accuracy_m=round(random.uniform(2.0, 5.0), 1),
                speed_mps=round(random.uniform(8.0, 15.0), 1),
                confidence=round(random.uniform(0.75, 0.96), 2),
                observed_at=seen_time,
                created_at=seen_time,
            )
            session.add(obs)
            created_defects.append(defect)
            defect_levels.append(level)

        logger.info(f"Seeded {len(created_defects)} demonstration defects with observation chains.")

        # 7. Seed 28 Work Orders
        wo_states = (
            ["VERIFIED"] * 9 +
            ["IN_PROGRESS"] * 9 +
            ["ASSIGNED"] * 6 +
            ["CREATED"] * 4
        )
        random.shuffle(wo_states)

        for i, status in enumerate(wo_states):
            defect = created_defects[i]
            contractor = contractors[i % len(contractors)] if status != "CREATED" else None
            level_val = defect_levels[i] if i < len(defect_levels) else "Moderate"
            sla_pol = sla_map.get(level_val, sla_mod)

            est_cost = round(random.uniform(8000.0, 45000.0), -2)
            days_prior = random.randint(1, 20)
            created_at = now - timedelta(days=days_prior)
            deadline = created_at + timedelta(hours=sla_pol.max_resolution_hours)

            wo = WorkOrder(
                defect_id=defect.id,
                contractor_id=contractor.id if contractor else None,
                sla_policy_id=sla_pol.id,
                status=status,
                priority=level_val.upper(),
                estimated_cost=est_cost,
                deadline=deadline,
                created_at=created_at,
                is_demo=True,
            )
            session.add(wo)
            session.flush()

            # Status history
            session.add(
                WorkOrderHistory(
                    work_order_id=wo.id,
                    from_status="CREATED",
                    to_status=status,
                    notes=f"State transitioned to {status} during municipal workflow processing.",
                    created_at=created_at + timedelta(hours=2),
                )
            )

            # If completed or verified, add repair record and verification
            if status in ["COMPLETED", "VERIFIED"]:
                repaired_at = created_at + timedelta(hours=random.randint(6, sla_pol.max_resolution_hours))
                rr = RepairRecord(
                    work_order_id=wo.id,
                    repaired_at=repaired_at,
                    materials_used="Cold-mix bitumen blend, 20mm aggregate compaction",
                    actual_cost=est_cost * random.uniform(0.9, 1.05),
                    created_at=repaired_at,
                )
                session.add(rr)
                session.flush()

                if status == "VERIFIED":
                    rv = RepairVerification(
                        repair_record_id=rr.id,
                        ai_damage_reduction_pct=round(random.uniform(88.0, 98.0), 1),
                        ai_recommendation="PASS",
                        human_decision="APPROVED",
                        decision_reason="Verified by human municipal engineer via post-repair imagery audit.",
                        verified_by_user_id=admin_user.id,
                    )
                    session.add(rv)

        logger.info(f"Seeded {len(wo_states)} maintenance work orders across lifecycle stages.")

        # 8. Seed 20 Citizen Reports & Complaints
        complaint_states = ["SUBMITTED"] * 6 + ["IN_PROGRESS"] * 7 + ["RESOLVED"] * 5 + ["REJECTED"] * 2
        for i, c_status in enumerate(complaint_states):
            days_ago = random.randint(1, 30)
            c_time = now - timedelta(days=days_ago)
            c_lat = base_lat + (random.random() - 0.5) * 0.03
            c_lon = base_lon + (random.random() - 0.5) * 0.03

            cr = CitizenReport(
                reporter_user_id=None,
                location=f"SRID=4326;POINT({c_lon:.6f} {c_lat:.6f})",
                description=f"Road surface depression and water accumulation near sector marker {i+1}.",
                is_demo=True,
            )
            session.add(cr)
            session.flush()

            cmp = Complaint(
                citizen_report_id=cr.id,
                defect_id=created_defects[i % len(created_defects)].id,
                status=c_status,
                assigned_to_user_id=admin_user.id if c_status != "SUBMITTED" else None,
                rejection_reason="Duplicate report already logged under maintenance" if c_status == "REJECTED" else None,
                is_demo=True,
                created_at=c_time,
            )
            session.add(cmp)
            session.flush()

            session.add(
                ComplaintStatusHistory(
                    complaint_id=cmp.id,
                    from_status="SUBMITTED",
                    to_status=c_status,
                    comment=f"Citizen report processed to {c_status}.",
                    created_at=c_time + timedelta(hours=3),
                )
            )

        logger.info(f"Seeded {len(complaint_states)} citizen reports and complaints.")

        session.commit()
        logger.info("Demonstration database seeding successfully completed!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ScamRoad Demonstration Database Seeder")
    parser.add_argument("--reset", action="store_true", help="Reset all previous demo rows before seeding")
    args = parser.parse_args()
    seed_demo_data(reset=args.reset)

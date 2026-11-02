"""Production demonstration database seeder for ScamRoad.

Populates realistic municipal GIS assets, road networks, defect chains,
work orders, contractor SLAs, and citizen complaints for Ludhiana, Punjab.
All demo entities are flagged with is_demo=True conforming to SPEC B7.
"""

from __future__ import annotations

import logging
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
    Contractor,
    RepairRecord,
    RepairVerification,
    SlaPolicy,
    WorkOrder,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scamroad.seed")


def seed_database() -> None:
    """Seed comprehensive municipal demo records into the PostgreSQL database."""
    logger.info("Initializing ScamRoad demonstration database seeding...")

    with Session(sync_engine) as session:
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

        admin_user = session.scalar(select(User).where(User.email == "admin@ludhiana.gov.in"))
        if not admin_user:
            admin_user = User(
                email="admin@ludhiana.gov.in",
                password_hash=pw_hash,
                full_name="Municipal Commissioner",
                is_active=True,
            )
            session.add(admin_user)
            session.flush()
            session.add(UserRole(user_id=admin_user.id, role_id=roles_map["admin"].id))

        eng_user = session.scalar(select(User).where(User.email == "engineer@ludhiana.gov.in"))
        if not eng_user:
            eng_user = User(
                email="engineer@ludhiana.gov.in",
                password_hash=pw_hash,
                full_name="Chief Executive Engineer",
                is_active=True,
            )
            session.add(eng_user)
            session.flush()
            session.add(UserRole(user_id=eng_user.id, role_id=roles_map["engineer"].id))

        contractor_user = session.scalar(select(User).where(User.email == "contractor@infra.in"))
        if not contractor_user:
            contractor_user = User(
                email="contractor@infra.in",
                password_hash=pw_hash,
                full_name="Punjab Infra Builders Lead",
                is_active=True,
            )
            session.add(contractor_user)
            session.flush()
            session.add(UserRole(user_id=contractor_user.id, role_id=roles_map["contractor"].id))

        citizen_user = session.scalar(select(User).where(User.email == "citizen@gmail.com"))
        if not citizen_user:
            citizen_user = User(
                email="citizen@gmail.com",
                password_hash=pw_hash,
                full_name="Harpreet Singh",
                is_active=True,
            )
            session.add(citizen_user)
            session.flush()
            session.add(UserRole(user_id=citizen_user.id, role_id=roles_map["citizen"].id))

        session.commit()
        logger.info("Seeded core administrative, engineering, and contractor user profiles.")

        # 2. Districts & Wards
        district = session.scalar(
            select(District).where(District.name == "Ludhiana Municipal Corporation")
        )
        if not district:
            district = District(
                name="Ludhiana Municipal Corporation",
                state="Punjab",
            )
            session.add(district)
            session.flush()

        wards_data = [
            (1, "Ward 1 - Clock Tower Central"),
            (2, "Ward 2 - Focal Point Industrial"),
            (3, "Ward 3 - Civil Lines & Mall Road"),
            (4, "Ward 4 - Model Town Residential"),
        ]

        ward_objects: dict[int, Ward] = {}
        for num, name in wards_data:
            ward = session.scalar(
                select(Ward).where(Ward.district_id == district.id, Ward.ward_number == num)
            )
            if not ward:
                ward = Ward(district_id=district.id, ward_number=num, name=name)
                session.add(ward)
                session.flush()
            ward_objects[num] = ward

        session.commit()
        logger.info("Seeded 4 Municipal Wards in Ludhiana district.")

        # 3. Roads & Road Segments
        roads_config = [
            (
                "Grand Trunk Road (NH-44)",
                "PB-NH44",
                ward_objects[1].id,
                "SRID=4326;LINESTRING(75.8500 30.9000, 75.8600 30.9100, 75.8700 30.9200)",
            ),
            (
                "Mall Road",
                "PB-MALL",
                ward_objects[3].id,
                "SRID=4326;LINESTRING(75.8450 30.9050, 75.8550 30.9080, 75.8650 30.9120)",
            ),
            (
                "Focal Point Heavy Highway",
                "PB-FP01",
                ward_objects[2].id,
                "SRID=4326;LINESTRING(75.8800 30.8900, 75.8950 30.8950, 75.9100 30.9000)",
            ),
            (
                "Model Town Boulevard",
                "PB-MT04",
                ward_objects[4].id,
                "SRID=4326;LINESTRING(75.8300 30.8850, 75.8380 30.8900, 75.8450 30.8950)",
            ),
        ]

        segment_objects: list[RoadSegment] = []
        for name, code, w_id, geom_wkt in roads_config:
            road = session.scalar(select(Road).where(Road.road_code == code))
            if not road:
                road = Road(
                    ward_id=w_id,
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
                    length_meters=1200.0,
                    geometry=geom_wkt,
                )
                session.add(seg)
                session.flush()
            segment_objects.append(seg)

        session.commit()
        logger.info("Seeded primary road corridors and PostGIS street segments.")

        # 4. Contractors & SLA Policies
        sla = session.scalar(select(SlaPolicy).where(SlaPolicy.name == "Critical 24h SLA"))
        if not sla:
            sla = SlaPolicy(
                name="Critical 24h SLA",
                severity_level="Critical",
                max_resolution_hours=24,
            )
            session.add(sla)
            session.flush()

        contractors_data = [
            (
                "Ludhiana Asphalt Infra Ltd",
                "Er. Rajesh Kumar",
                "+91-98765-01001",
                "ops@ludhiana-asphalt.com",
            ),
            (
                "Punjab Highway Works Corp",
                "Er. Gurpreet Singh",
                "+91-98765-01002",
                "projects@punjabhighway.in",
            ),
            (
                "Satluj Pavement Engineers",
                "Er. Aman Verma",
                "+91-98765-01003",
                "contact@satlujpave.com",
            ),
        ]

        contractor_objs: list[Contractor] = []
        for c_name, c_contact, c_phone, c_email in contractors_data:
            c = session.scalar(select(Contractor).where(Contractor.name == c_name))
            if not c:
                c = Contractor(
                    name=c_name,
                    contact_person=c_contact,
                    phone=c_phone,
                    email=c_email,
                    is_active=True,
                )
                session.add(c)
                session.flush()
            contractor_objs.append(c)

        session.commit()
        logger.info("Seeded Certified Contractors and Municipal SLA Policies.")

        # 5. Registered Edge Device
        device = session.scalar(select(Device).where(Device.device_key == "OPPO-K13-DEMO-01"))
        if not device:
            device = Device(
                device_key="OPPO-K13-DEMO-01",
                model_name="OPPO K13",
                device_type="android",
                is_active=True,
                active_model_version="scamroad-yolov8n-v1.0",
            )
            session.add(device)
            session.flush()

        # 6. Canonical Defects & Observations
        defects_to_seed = [
            ("POTHOLE", 30.9012, 75.8524, 86.5, "Critical", segment_objects[0].id, 4),
            ("POTHOLE", 30.9055, 75.8562, 74.0, "Severe", segment_objects[0].id, 3),
            ("CRACK_LONG", 30.9082, 75.8495, 48.0, "Moderate", segment_objects[1].id, 2),
            ("POTHOLE", 30.8920, 75.8845, 92.0, "Critical", segment_objects[2].id, 5),
            ("CRACK_ALLIGATOR", 30.8965, 75.8980, 68.0, "Severe", segment_objects[2].id, 2),
            ("POTHOLE", 30.8885, 75.8350, 32.0, "Minor", segment_objects[3].id, 1),
        ]

        created_defects: list[Defect] = []
        now = datetime.now(UTC)

        for code, lat, lon, score, level, seg_id, sightings in defects_to_seed:
            loc_wkt = f"SRID=4326;POINT({lon} {lat})"
            defect = session.scalar(
                select(Defect).where(Defect.road_segment_id == seg_id, Defect.class_code == code)
            )
            if not defect:
                defect = Defect(
                    class_code=code,
                    location=loc_wkt,
                    road_segment_id=seg_id,
                    status="ACTIVE",
                    times_seen=sightings,
                    first_seen=now - timedelta(days=5),
                    last_seen=now - timedelta(hours=2),
                    is_demo=True,
                )
                session.add(defect)
                session.flush()

                # Add severity assessment
                sev = SeverityAssessment(
                    defect_id=defect.id,
                    raw_score=score,
                    normalized_score=score,
                    level=level,
                    factor_breakdown={"base": 70.0, "area_pct": 5.2, "road_class": 1.2},
                    missing_factors=[],
                    needs_human_review=(level == "Critical"),
                    source="auto",
                )
                session.add(sev)

                # Add immutable observation
                obs = DefectObservation(
                    defect_id=defect.id,
                    device_id=device.id,
                    location=loc_wkt,
                    gps_accuracy_m=3.5,
                    speed_mps=11.2,
                    confidence=0.91,
                    observed_at=now - timedelta(hours=2),
                )
                session.add(obs)
            created_defects.append(defect)

        session.commit()
        logger.info(
            f"Seeded {len(created_defects)} canonical defects with observation chains and severity scores."
        )

        # 7. Work Orders & Repair Verification (Rule R8 Demonstration)
        wo1 = session.scalar(select(WorkOrder).where(WorkOrder.defect_id == created_defects[0].id))
        if not wo1:
            wo1 = WorkOrder(
                defect_id=created_defects[0].id,
                contractor_id=contractor_objs[0].id,
                sla_policy_id=sla.id,
                status="ASSIGNED",
                priority="CRITICAL",
                estimated_cost=18500.0,
                deadline=now + timedelta(hours=24),
            )
            session.add(wo1)

        wo2 = session.scalar(select(WorkOrder).where(WorkOrder.defect_id == created_defects[1].id))
        if not wo2:
            wo2 = WorkOrder(
                defect_id=created_defects[1].id,
                contractor_id=contractor_objs[1].id,
                sla_policy_id=sla.id,
                status="IN_PROGRESS",
                priority="HIGH",
                estimated_cost=12000.0,
                deadline=now + timedelta(hours=36),
            )
            session.add(wo2)

        wo3 = session.scalar(select(WorkOrder).where(WorkOrder.defect_id == created_defects[3].id))
        if not wo3:
            wo3 = WorkOrder(
                defect_id=created_defects[3].id,
                contractor_id=contractor_objs[0].id,
                sla_policy_id=sla.id,
                status="VERIFIED",
                priority="CRITICAL",
                estimated_cost=24000.0,
                deadline=now - timedelta(days=1),
            )
            session.add(wo3)
            session.flush()

            # Record repair and authoritative human verification sign-off (Rule R8)
            rr = RepairRecord(
                work_order_id=wo3.id,
                repaired_at=now - timedelta(hours=18),
                materials_used="Cold-mix bitumen blend, 20mm aggregate compaction",
                actual_cost=22500.0,
            )
            session.add(rr)
            session.flush()

            rv = RepairVerification(
                repair_record_id=rr.id,
                ai_damage_reduction_pct=94.5,
                ai_recommendation="PASS",
                human_decision="APPROVED",
                decision_reason="Visual inspection and ultrasonic compaction test verified. Surface grade restored flush with asphalt.",
                verified_by_user_id=eng_user.id,
            )
            session.add(rv)

        session.commit()
        logger.info(
            "Seeded Maintenance Work Orders across all Kanban stages with Rule R8 verification sign-off."
        )

        # 8. Citizen Damage Complaints
        c1 = session.scalar(select(Complaint).where(Complaint.defect_id == created_defects[0].id))
        if not c1:
            loc_wkt = "SRID=4326;POINT(75.8524 30.9012)"
            rep = CitizenReport(
                reporter_user_id=citizen_user.id,
                location=loc_wkt,
                description="Massive crater causing two-wheelers to swerve dangerously into oncoming traffic.",
            )
            session.add(rep)
            session.flush()

            c1 = Complaint(
                citizen_report_id=rep.id,
                defect_id=created_defects[0].id,
                status="IN_PROGRESS",
                assigned_to_user_id=eng_user.id,
            )
            session.add(c1)
            session.flush()

            hist = ComplaintStatusHistory(
                complaint_id=c1.id,
                from_status="SUBMITTED",
                to_status="IN_PROGRESS",
                changed_by_user_id=eng_user.id,
                comment="Assigned to Ludhiana Asphalt Infra under 24-hour priority SLA.",
            )
            session.add(hist)

        session.commit()
        logger.info("Seeded Citizen Damage Complaints and State Machine audit logs.")

        # 9. Road Health Scores for Forecasting
        for seg in segment_objects:
            # Seed 3 historical scores so forecaster has real accumulated history (Rule R6)
            for days_ago, score_val in [(60, 92.0), (30, 85.0), (5, 79.5)]:
                p_start = now - timedelta(days=days_ago)
                p_end = p_start + timedelta(days=25)
                existing_rhi = session.scalar(
                    select(RoadHealthScore).where(
                        RoadHealthScore.segment_id == seg.id,
                        RoadHealthScore.period_start == p_start,
                    )
                )
                if not existing_rhi:
                    rhi = RoadHealthScore(
                        segment_id=seg.id,
                        period_start=p_start,
                        period_end=p_end,
                        score=score_val,
                        defect_density=1.6,
                        method_version="rhi_v1.0",
                    )
                    session.add(rhi)

        # 10. Weather Record
        wr = session.scalar(select(WeatherRecord).where(WeatherRecord.district_id == district.id))
        if not wr:
            wr = WeatherRecord(
                district_id=district.id,
                recorded_at=now,
                rainfall_mm=14.2,
                temperature_celsius=27.4,
                humidity_pct=62.0,
                weather_provider="open-meteo",
            )
            session.add(wr)

        # 11. Initial Notifications
        notif = session.scalar(select(Notification).where(Notification.user_id == admin_user.id))
        if notif is None:
            notif = Notification(
                user_id=admin_user.id,
                title="Critical Pothole Alert",
                message="Critical defect detected on GT Road (NH-44). Work order dispatched.",
                channel="IN_APP",
                is_read=False,
            )
            session.add(notif)

        session.commit()
        logger.info(
            "Seeded historical Road Health Scores, Weather records, and Notification alerts."
        )

    logger.info("ScamRoad demonstration database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()

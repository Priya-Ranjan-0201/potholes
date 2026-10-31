"""Municipal reporting and CSV export generation service.

Implements SPEC B10:
- CSV stream with mandatory headers, data-as-of, and explicit Estimated vs Verified labels.
- Structured executive summary payload with narrative parity verification.
"""

from __future__ import annotations

import csv
import io
import re
from datetime import UTC, datetime
from typing import Any


class MunicipalReportingService:
    """Service generating compliant municipal reports and data exports."""

    def generate_defects_csv(self, defects_data: list[dict[str, Any]]) -> str:
        """Generate compliant RFC 4180 CSV export of defects."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Write metadata headers
        now_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
        writer.writerow(["# ScamRoad Municipal Defect Export"])
        writer.writerow(["# Generated At", now_str])
        writer.writerow(["# Method Version", "rhi_v1.0"])
        writer.writerow([])

        # Header row
        writer.writerow(
            [
                "defect_id",
                "class_code",
                "road_name",
                "latitude",
                "longitude",
                "relative_area_pct",
                "severity_score",
                "severity_level",
                "detection_confidence",
                "verification_status",
                "times_seen",
                "created_at",
            ]
        )

        for d in defects_data:
            writer.writerow(
                [
                    d.get("id", ""),
                    d.get("class_code", ""),
                    d.get("road_name", "Unassigned"),
                    d.get("latitude", 0.0),
                    d.get("longitude", 0.0),
                    d.get("relative_area_pct", 0.0),
                    d.get("severity_score", 0.0),
                    d.get("severity_level", "MODERATE"),
                    d.get("confidence", 0.0),
                    "VERIFIED" if d.get("is_verified", False) else "ESTIMATED_AI",
                    d.get("times_seen", 1),
                    d.get("created_at", ""),
                ]
            )

        return output.getvalue()

    def generate_executive_summary_payload(
        self,
        total_defects: int,
        critical_count: int,
        resolved_count: int,
        average_health_score: float,
        repair_budget_allocated: float,
        contractor_compliance_pct: float,
    ) -> dict[str, Any]:
        """Generate structured executive municipal summary payload.

        Enforces SPEC B10: Every number in the narrative summary must exist in this payload.
        """
        now_iso = datetime.now(UTC).isoformat()

        # Build strict narrative where every number traces to payload fields
        narrative = (
            f"Municipal Road Condition Brief as of {now_iso[:10]}. "
            f"The city road network currently records {total_defects} road defects, "
            f"with {critical_count} classified as critical hazards requiring priority maintenance. "
            f"To date, {resolved_count} repairs have been resolved, achieving a contractor SLA "
            f"compliance rate of {contractor_compliance_pct:.1f}%. "
            f"The network Road Health Index averages {average_health_score:.1f} out of 100. "
            f"Total budget allocated stands at ₹{repair_budget_allocated:.0f}."
        )

        return {
            "generated_at": now_iso,
            "total_defects": total_defects,
            "critical_count": critical_count,
            "resolved_count": resolved_count,
            "average_health_score": round(average_health_score, 1),
            "health_index_scale_max": 100,
            "repair_budget_allocated": round(repair_budget_allocated, 2),
            "contractor_compliance_pct": round(contractor_compliance_pct, 1),
            "narrative_summary": narrative,
        }

    @staticmethod
    def verify_summary_numbers_parity(payload: dict[str, Any]) -> bool:
        """Verify that every number in the narrative summary exists in the structured payload.

        Unit test requirement from SPEC B10.
        """
        narrative = payload.get("narrative_summary", "")

        # Extract all numbers from narrative (integers, floats, dates ignored)
        # Match standalone numbers or decimals (e.g. 104, 82.5, 94.0)
        tokens = re.findall(r"\b\d+(?:\.\d+)?\b", narrative)

        # Collect all numeric values in payload
        payload_numbers: set[str] = set()
        date_str = payload.get("generated_at", "")[:10]  # e.g. 2026-10-31
        for part in date_str.split("-"):
            payload_numbers.add(str(int(part)))

        for val in payload.values():
            if isinstance(val, (int, float)):
                payload_numbers.add(f"{val}")
                payload_numbers.add(f"{val:.1f}")
                payload_numbers.add(f"{val:.0f}")
                if isinstance(val, int):
                    payload_numbers.add(str(val))

        # Check every token
        for token in tokens:
            # Strip leading zeros
            norm_token = str(float(token)) if "." in token else str(int(token))
            matched = False
            for p_num in payload_numbers:
                if p_num in (token, norm_token) or token in p_num:
                    matched = True
                    break
            if not matched:
                return False

        return True


reporting_service = MunicipalReportingService()

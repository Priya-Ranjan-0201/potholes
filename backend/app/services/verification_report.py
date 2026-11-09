"""Automated Road Repair Verification Reporting Service.

Generates official PDF verification certificates and CSV audit logs.
Adheres strictly to Rule R8 (Authoritative human sign-off advisory notice)
and Rule R4 (Explicit uncalibrated pixel area disclaimer).
"""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_verification_pdf(
    verification_data: dict[str, Any],
    corridor_name: str = "NH-44 GT Road Corridor",
    contractor_name: str = "Apex Pavement Infrastructure Ltd",
    verification_id: str | None = None,
) -> bytes:
    """Generate professional PDF repair verification certificate."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "CertSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=8,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    mono_style = ParagraphStyle(
        "CertMono",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F172A"),
    )
    disclaimer_style = ParagraphStyle(
        "CertDisclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#64748B"),
        alignment=1,  # Centered
    )

    elements = []

    # Title & Metadata
    cert_id = verification_id or verification_data.get("id", "VER-2026-0891")
    elements.append(Paragraph("MUNICIPAL ROAD REPAIR VERIFICATION CERTIFICATE", title_style))
    elements.append(
        Paragraph(
            f"Official AI-Assisted Pavement Quality Audit &bull; Record ID: <b>{cert_id}</b> &bull; Generated: {datetime.now(UTC).strftime('%b %d, %Y %H:%M UTC')}",
            subtitle_style,
        )
    )
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Summary Grid: Status, Effectiveness, Location
    status_raw = verification_data.get("status", "successfully_repaired").upper()
    status_label = status_raw.replace("_", " ")

    status_color = colors.HexColor("#16A34A") if "SUCCESS" in status_raw else (
        colors.HexColor("#D97706") if "PARTIAL" in status_raw else (
            colors.HexColor("#DC2626") if "INCOMPLETE" in status_raw or "RECURRING" in status_raw else colors.HexColor("#475569")
        )
    )

    status_badge_text = f"<font color='{status_color.hexval()}'><b>{status_label}</b></font>"
    eff_pct = verification_data.get("effectiveness_pct", 0.0)

    summary_table_data = [
        [
            Paragraph("<b>Verification Result:</b>", body_style),
            Paragraph(status_badge_text, body_style),
            Paragraph("<b>Repair Effectiveness:</b>", body_style),
            Paragraph(f"<b>{eff_pct:.1f}%</b>", body_style),
        ],
        [
            Paragraph("<b>Corridor / Ward:</b>", body_style),
            Paragraph(corridor_name, body_style),
            Paragraph("<b>Contractor:</b>", body_style),
            Paragraph(contractor_name, body_style),
        ],
        [
            Paragraph("<b>GPS Coordinates:</b>", body_style),
            Paragraph(f"{verification_data.get('latitude', 30.9010):.4f}&deg; N, {verification_data.get('longitude', 75.8573):.4f}&deg; E", mono_style),
            Paragraph("<b>Inspection Date:</b>", body_style),
            Paragraph(str(verification_data.get("inspection_date", datetime.now(UTC).strftime("%Y-%m-%d"))), body_style),
        ],
    ]
    summary_table = Table(summary_table_data, colWidths=[110, 160, 110, 160])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 12))

    # Explanation Card
    expl_text = verification_data.get("explanation", "Verification completed with evidence registration.")
    expl_data = [
        [
            Paragraph(f"<b>Engineering Assessment:</b> {expl_text}", body_style)
        ]
    ]
    expl_table = Table(expl_data, colWidths=[540])
    expl_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(expl_table)
    elements.append(Spacer(1, 12))

    # Detailed Analytics Table: Surface Area & Defect Counts
    elements.append(Paragraph("1. Damage Area & Surface Remediation Analytics", section_heading))
    bef_area = verification_data.get("before_area_px", 0)
    rem_area = verification_data.get("remaining_area_px", 0)
    new_area = verification_data.get("new_area_px", 0)
    red_pct = verification_data.get("area_reduction_pct", 0.0)

    analytics_data = [
        ["Metric", "Value", "Unit / Basis", "Evaluation Significance"],
        ["Original Damaged Area", f"{bef_area:,}", "pixels (normalized relative)", "Pre-repair distress footprint"],
        ["Remaining Damaged Area", f"{rem_area:,}", "pixels (normalized relative)", "Residual unsealed depression"],
        ["Newly Formed Distress", f"{new_area:,}", "pixels (normalized relative)", "Adjacent pavement cracks"],
        ["Surface Area Reduction", f"{red_pct:.1f}%", "percentage reduction", "Compaction volume change"],
        ["Repair Effectiveness Score", f"{eff_pct:.1f}%", "weighted index", "Overall remediation quality"],
    ]
    analytics_table = Table(analytics_data, colWidths=[150, 100, 140, 150])
    analytics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
            ]
        )
    )
    elements.append(analytics_table)
    elements.append(Spacer(1, 12))

    # Alignment & Computer Vision Telemetry
    elements.append(Paragraph("2. Computer Vision Registration & Perspective Telemetry", section_heading))
    align_conf = verification_data.get("alignment_confidence", 0.0)
    inliers = verification_data.get("inliers_count", 0)
    matches = verification_data.get("matches_count", 0)
    inlier_ratio = verification_data.get("inlier_ratio", 0.0)

    cv_data = [
        ["Registration Parameter", "Observed Value", "Threshold Requirement", "Validation Status"],
        ["ORB Feature Matches", str(matches), "&ge; 8 matches", "PASS" if matches >= 8 else "FAIL"],
        ["RANSAC Inliers", str(inliers), "&ge; 12 inliers", "PASS" if inliers >= 12 else "FAIL"],
        ["Inlier Ratio", f"{inlier_ratio * 100:.1f}%", "&ge; 15.0%", "PASS" if inlier_ratio >= 0.15 else "FAIL"],
        ["Homography Perspective Warping", "Applied" if verification_data.get("perspective_corrected") else "Uncalibrated", "Condition Sanity", "VALID" if inliers >= 12 else "UNCERTAIN"],
        ["Alignment Confidence Score", f"{align_conf * 100:.1f}%", "&ge; 50.0%", "CONFIRMED" if align_conf >= 0.50 else "INCONCLUSIVE"],
    ]
    cv_table = Table(cv_data, colWidths=[150, 100, 140, 150])
    cv_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
            ]
        )
    )
    elements.append(cv_table)
    elements.append(Spacer(1, 12))

    # Recurrence Analysis
    elements.append(Paragraph("3. Recurrence & Structural Pavement History", section_heading))
    is_rec = verification_data.get("recurrence_detected", False)
    rec_cnt = verification_data.get("recurrence_count", 0)
    days_rec = verification_data.get("days_to_recurrence")

    rec_data = [
        ["Parameter", "Result", "Technical Interpretation"],
        ["Recurring Distress Flag", "DETECTED (RECURRING)" if is_rec else "NEGATIVE (No recurrence)", "Matched against historical GPS records"],
        ["Recurrence Frequency", f"{rec_cnt} occurrences", "Repeated failure alert" if rec_cnt >= 2 else "Within standard tolerance"],
        ["Time Between Repairs", f"{days_rec} days" if days_rec is not None else "N/A (First repair)", "Pavement lifespan observation"],
    ]
    rec_table = Table(rec_data, colWidths=[150, 140, 250])
    rec_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )
    elements.append(rec_table)
    elements.append(Spacer(1, 18))

    # Sign-off box
    signoff_data = [
        [
            Paragraph("<b>Automated AI Verification Assessment:</b> Advisory recommendation generated via YOLO11n INT8 and OpenCV homography registration.", body_style),
            Paragraph("<b>Authoritative Engineer Sign-Off:</b><br/><br/>____________________________________<br/>Lead Municipal Infrastructure Engineer", body_style),
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[270, 270])
    signoff_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94A3B8")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(signoff_table)
    elements.append(Spacer(1, 14))

    # Legal Disclaimer (SPEC v12 Rule V8 & Rule R8)
    elements.append(
        Paragraph(
            "Student research project. Not an official government system. Not safety-certified. "
            "AI verification results are advisory and strictly decoupled from contractual liability. "
            "All surface measurements represent normalized pixel area estimates and do not constitute legal survey bounds.",
            disclaimer_style,
        )
    )

    doc.build(elements)
    return buffer.getvalue()


def generate_verifications_csv(records: list[dict[str, Any]]) -> str:
    """Generate CSV string containing complete historical repair verification records."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header Row
    writer.writerow(
        [
            "verification_id",
            "corridor_name",
            "latitude",
            "longitude",
            "inspection_date",
            "repair_date",
            "status",
            "effectiveness_pct",
            "before_area_px",
            "remaining_area_px",
            "area_change_px",
            "area_reduction_pct",
            "alignment_confidence",
            "inliers_count",
            "matches_count",
            "recurrence_detected",
            "recurrence_count",
            "days_to_recurrence",
            "measurement_type",
            "explanation",
        ]
    )

    for r in records:
        writer.writerow(
            [
                r.get("id", ""),
                r.get("corridor_name", ""),
                f"{r.get('latitude', 0.0):.6f}",
                f"{r.get('longitude', 0.0):.6f}",
                str(r.get("inspection_date", "")),
                str(r.get("repair_date", "")),
                r.get("status", ""),
                r.get("effectiveness_pct", 0.0),
                r.get("before_area_px", 0),
                r.get("remaining_area_px", 0),
                r.get("area_change_px", 0),
                r.get("area_reduction_pct", 0.0),
                r.get("alignment_confidence", 0.0),
                r.get("inliers_count", 0),
                r.get("matches_count", 0),
                "YES" if r.get("recurrence_detected") else "NO",
                r.get("recurrence_count", 0),
                r.get("days_to_recurrence", ""),
                r.get("measurement_type", "uncalibrated_pixel_area_relative"),
                r.get("explanation", "").replace("\n", " "),
            ]
        )

    return output.getvalue()

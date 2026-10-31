"""SQLAlchemy database models registry.

Exports all 39 tables required by SPEC B7 for Alembic migrations and application usage.
"""

from backend.app.models.analytics import (
    Forecast,
    Notification,
    NotificationRule,
    ReportJob,
    SystemSetting,
    WeatherRecord,
)
from backend.app.models.auth import AuditLog, Role, User, UserRole
from backend.app.models.base import Base
from backend.app.models.complaint import (
    CitizenReport,
    Complaint,
    ComplaintStatusHistory,
    ComplaintUpvote,
)
from backend.app.models.defect import (
    Defect,
    DefectMergeLog,
    DefectObservation,
    RoadHealthScore,
    SeverityAssessment,
)
from backend.app.models.device import Device, DeviceHeartbeat
from backend.app.models.geo import Department, District, Road, RoadSegment, Ward
from backend.app.models.maintenance import (
    BudgetAllocation,
    Contractor,
    RepairRecord,
    RepairVerification,
    SlaPolicy,
    WorkOrder,
    WorkOrderHistory,
)
from backend.app.models.ml import (
    Detection,
    Inspection,
    Measurement,
    Media,
    ModelVersion,
    SegmentationMask,
)

__all__ = [
    "AuditLog",
    "Base",
    "BudgetAllocation",
    "CitizenReport",
    "Complaint",
    "ComplaintStatusHistory",
    "ComplaintUpvote",
    "Contractor",
    "Defect",
    "DefectMergeLog",
    "DefectObservation",
    "Department",
    "Detection",
    "Device",
    "DeviceHeartbeat",
    "District",
    "Forecast",
    "Inspection",
    "Measurement",
    "Media",
    "ModelVersion",
    "Notification",
    "NotificationRule",
    "RepairRecord",
    "RepairVerification",
    "ReportJob",
    "Road",
    "RoadHealthScore",
    "RoadSegment",
    "Role",
    "SegmentationMask",
    "SeverityAssessment",
    "SlaPolicy",
    "SystemSetting",
    "User",
    "UserRole",
    "Ward",
    "WeatherRecord",
    "WorkOrder",
    "WorkOrderHistory",
]

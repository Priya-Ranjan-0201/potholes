# ScamRoad Frontend Gaps & API Contract Ledger (Rule F1)

This document records the alignment between `web/` frontend features and backend FastAPI REST endpoints.

| Feature Area | Frontend Component | Backend API Endpoint | Status | Notes |
|---|---|---|---|---|
| **Overview Metrics** | `DashboardPage.tsx` | `GET /api/v1/stats/overview` | ALIGNED | Total defects, open, repaired, critical, class breakdown. |
| **Ward Hotspot Grid** | `DashboardPage.tsx` | `GET /api/v1/stats/wards` | ALIGNED | Ward defect counts, critical hazards, allocated/spent budget. |
| **Contractor SLAs** | `MaintenancePage.tsx` | `GET /api/v1/stats/contractors` | ALIGNED | Work order compliance rate, assignments, completions. |
| **14-Day Activity Trends**| `DashboardPage.tsx` | `GET /api/v1/stats/trends?days=14` | ALIGNED | Daily observation, complaint, and repair time series. |
| **Defect Registry** | `DefectsPage.tsx` | `GET /api/v1/defects` | ALIGNED | Supports query filters: status, class_code, severity. |
| **Defect Detail & Audit**| `DefectsPage.tsx` | `GET /api/v1/defects/{id}` | ALIGNED | Observations timeline, haversine coords, human audit log. |
| **Severity Override** | `DefectsPage.tsx` | `POST /api/v1/defects/{id}/override` | ALIGNED | Enforces human engineer role, saves override level & reason. |
| **Live AI Inference** | `ScannerPage.tsx`, `CapturePage.tsx` | `POST /api/v1/infer` | ALIGNED | Real YOLO11n ONNX INT8 multipart image inference. |
| **Work Orders Kanban** | `MaintenancePage.tsx` | `GET /api/v1/work-orders` | ALIGNED | State machine: CREATED -> ASSIGNED -> IN_PROGRESS -> UNDER_REPAIR -> COMPLETED -> VERIFIED. |
| **Repair Submission** | `MaintenancePage.tsx` | `POST /api/v1/work-orders/{id}/repair`| ALIGNED | Contractor materials used & actual expenditure. |
| **Engineer Verification**| `MaintenancePage.tsx` | `POST /api/v1/work-orders/{id}/verify`| ALIGNED | AI recommendation, human decision & sign-off rationale. |
| **Citizen Complaints** | `ComplaintsPage.tsx` | `GET /api/v1/complaints`, `POST /api/v1/complaints` | ALIGNED | Photo evidence upload, ticket status flow. |
| **Model Telemetry** | `ModelsPage.tsx` | `ml/runs/metrics.json` | ALIGNED | Held-out mAP50, latency, confusion matrix, PR curves. |
| **Empirical Evaluation**| `EvaluationPage.tsx` | `ml/runs/metrics.json`, `ml/runs/ablation.json` | ALIGNED | 12-image failure gallery, INT8 calibration drop. |

*No missing backend endpoints identified. All visible controls bind directly to real backend routes or generated test split artifacts.*


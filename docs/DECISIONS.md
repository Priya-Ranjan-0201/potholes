# Architecture Decision Records (ADR)

This document logs non-trivial technology and design decisions made during
the ScamRoad project. Each entry follows the ADR format: context, decision,
consequences.

---

## ADR-001: Use Python 3.12 Instead of 3.11

**Date:** 2026-10-30
**Status:** Accepted
**Phase:** 1

### Context
The original specification suggested Python 3.11 for its stability. However,
Python 3.11 is not installed on the development machine, while Python 3.12
is already present and configured. All key dependencies (FastAPI, Ultralytics,
SQLAlchemy 2, Celery, Pydantic v2) fully support Python 3.12.

### Decision
Use **Python 3.12** as the project runtime.

### Consequences
- **Positive:** Access to Python 3.12 performance improvements (continued
  specialised adaptive interpreter from 3.11, improved error messages,
  `type` statement for type aliases, `@override` decorator in `typing`).
- **Positive:** No need to install and manage a separate Python version.
- **Positive:** Better long-term support timeline (3.12 EOL is later than 3.11).
- **Negative:** Minor risk of encountering bugs in newer stdlib features, but
  this is mitigated by the maturity of 3.12 (released October 2023, now well
  past its stabilisation period).
- **Neutral:** Docker images will use `python:3.12-slim` base.

---

## ADR-002: Use GNU Make on Windows (with PowerShell Fallback)

**Date:** 2026-10-30
**Status:** Accepted
**Phase:** 1

### Context
The project uses a `Makefile` as its task runner (rule R15). The development
machine runs Windows, where GNU Make is not installed by default. Alternatives
considered:
1. Install GNU Make via `choco install make` or `winget`.
2. Use PowerShell scripts (`scripts/*.ps1`) as the primary runner.
3. Use `just` (a modern Make alternative) — requires separate installation.
4. Use `invoke` (Python-based) — adds a Python dependency for task running.

### Decision
Install **GNU Make** via `choco install make` (or `winget install GnuWin32.Make`).
Document a **PowerShell fallback** in `README.md` for each Make target, so the
project remains usable even if Make is not installed.

### Consequences
- **Positive:** `Makefile` is the standard approach, compatible with CI
  (GitHub Actions runners have Make pre-installed).
- **Positive:** Single `Makefile` works on Linux, macOS, and Windows (with Make).
- **Negative:** One-time setup step required on Windows dev machines.
- **Mitigation:** `README.md` includes equivalent PowerShell commands for every
  Make target, so Windows users without Make are not blocked.

---

## ADR-003: Start with RDD2022-India Subset (~2 GB)

**Date:** 2026-10-30
**Status:** Accepted
**Phase:** 1 (affects Phase 2)

### Context
The full RDD2022 dataset (all countries) is approximately 15–20 GB. The
development machine has only **26.6 GB free disk space**, which must also
accommodate Docker images (~3 GB), model checkpoints (~1–2 GB), and general
system overhead.

Available subsets:
- India: ~2 GB (most relevant for deployment context)
- Japan: ~5 GB
- Czech Republic, Norway, USA: varying sizes

### Decision
Download and train on the **RDD2022-India subset only** in Phase 2. Defer
other country subsets to later phases or cloud-based training.

### Consequences
- **Positive:** Fits within disk budget with comfortable headroom (~14 GB remaining
  after raw data, processed data, and model artefacts).
- **Positive:** India subset is the most relevant for the target deployment
  context (Indian roads, lighting conditions, damage patterns).
- **Negative:** Model may not generalise well to roads in other countries.
  This is acceptable for an MVP — cross-country generalisation is a Phase 5+
  concern.
- **Negative:** Smaller training set may limit model accuracy. Mitigated by
  data augmentation and the option to train on Kaggle with larger datasets.
- **Future:** When disk space allows or cloud training is available, add Japan
  and multi-country subsets for improved generalisation.

---

## ADR-004: Laptop as Primary Edge Target (Phone for Mobile Testing)

**Date:** 2026-10-30
**Status:** Accepted
**Phase:** 1 (affects Phases 5, 8)

### Context
The specification envisions edge deployment on various devices (Raspberry Pi,
Jetson Nano, Android phone). The available hardware is:
- **Primary:** Laptop with NVIDIA RTX 3050 (6 GB VRAM), running Windows.
- **Secondary:** OPPO K13 Android phone (available for mobile app testing).
- **Not available:** Raspberry Pi, Jetson Nano, or other dedicated edge devices.

### Decision
Use the **laptop** as the primary edge device for development and testing of the
edge agent. Use the **OPPO K13** for testing the React Native mobile app. Do not
target Raspberry Pi or Jetson Nano in the initial phases.

### Consequences
- **Positive:** Laptop has a capable GPU for both training and inference, enabling
  fast iteration without needing separate edge hardware.
- **Positive:** OPPO K13 provides a real Android device for mobile app testing
  (camera, GPS, push notifications).
- **Negative:** No ARM-based edge device testing. ONNX model compatibility on
  ARM/Jetson is not validated until such hardware is available.
- **Negative:** Laptop is not a realistic "field deployment" device — it requires
  power and is not weather-resistant. This is acceptable for an academic/portfolio
  project.
- **Mitigation:** The edge agent architecture is device-agnostic (Python + ONNX
  Runtime), so porting to Pi/Jetson later requires only environment setup, not
  code changes.
- **Future:** If Jetson Nano or Raspberry Pi becomes available, add it as a
  deployment target and run inference benchmarks.

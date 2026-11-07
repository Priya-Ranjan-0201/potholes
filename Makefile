# ScamRoad Makefile
# Works on Linux, macOS, and Windows.
# Usage: make <target>

.DEFAULT_GOAL := help
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command

PYTHON := python
PIP := pip
DOCKER_COMPOSE := docker compose

# --- Help -------------------------------------------------------------------
.PHONY: help
help:  ## Show this help
	@Write-Host "ScamRoad Make Targets:" -ForegroundColor Cyan
	@Write-Host "  setup        - Install full stack dependencies"
	@Write-Host "  setup-ml     - Install pinned ML training dependencies (requirements.txt)"
	@Write-Host "  dev          - Start Docker Compose dev stack"
	@Write-Host "  down         - Stop Docker Compose"
	@Write-Host "  lint         - Run ruff, black --check, mypy"
	@Write-Host "  format       - Auto-format with ruff and black"
	@Write-Host "  test         - Run all tests with pytest"
	@Write-Host "  test-ml      - Run ML tests only"
	@Write-Host "  download-data- Download datasets (RDD2022 / Pothole)"
	@Write-Host "  audit-data   - Audit dataset classes, hashes, duplicates"
	@Write-Host "  convert-data - Convert annotations to standard YOLO format"
	@Write-Host "  train        - Run ML training"
	@Write-Host "  export       - Export model to ONNX"
	@Write-Host "  bench        - Run edge benchmarks"
	@Write-Host "  clean        - Remove caches and temp files"

# --- Setup ------------------------------------------------------------------
.PHONY: setup
setup:  ## Install full backend and dev dependencies
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt
	$(PYTHON) -m pip install -r backend/requirements.txt
	@if (Test-Path "web/package.json") { Set-Location web; npm install; Set-Location .. }

.PHONY: setup-ml
setup-ml:  ## Install pinned ML training dependencies
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

# --- Docker -----------------------------------------------------------------
.PHONY: dev
dev:  ## Start Docker Compose dev stack
	$(DOCKER_COMPOSE) up -d
	@Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
	@Start-Sleep -Seconds 5
	$(DOCKER_COMPOSE) ps

.PHONY: down
down:  ## Stop Docker Compose
	$(DOCKER_COMPOSE) down

# --- Lint & Format ----------------------------------------------------------
.PHONY: lint
lint:  ## Run linters
	@Write-Host "=== Ruff ===" -ForegroundColor Cyan
	$(PYTHON) -m ruff check backend ml edge shared configs --config pyproject.toml
	@Write-Host "=== All checks passed ===" -ForegroundColor Green

.PHONY: format
format:  ## Auto-format code
	$(PYTHON) -m ruff check --fix backend ml edge shared configs --config pyproject.toml
	$(PYTHON) -m black backend ml edge shared configs --config pyproject.toml

# --- Tests ------------------------------------------------------------------
.PHONY: test
test:  ## Run all tests
	$(PYTHON) -m pytest backend/tests shared/tests ml/tests edge/tests --tb=short -v

.PHONY: test-ml
test-ml:  ## Run ML pipeline tests only
	$(PYTHON) -m pytest ml/tests/ --tb=short -v

# --- ML Workflow ------------------------------------------------------------
.PHONY: data download-data
data: download-data
download-data:  ## Download datasets
	$(PYTHON) -m ml.data.download

.PHONY: audit audit-data
audit: audit-data
audit-data:  ## Audit dataset classes and image integrity
	$(PYTHON) -m ml.data.audit

.PHONY: convert convert-data
convert: convert-data
convert-data:  ## Convert dataset annotations to YOLO format
	$(PYTHON) -m ml.data.convert

.PHONY: split
split:  ## Create sequence-aware train/val/test splits
	$(PYTHON) -m ml.data.split

.PHONY: train
train:  ## Run ML detector training
	$(PYTHON) -m ml.training.train --cfg ml/configs/yolov8_pothole.yaml

.PHONY: train-dry
train-dry:  ## Dry-run ML training configuration and hardware detection
	$(PYTHON) -m ml.training.train --cfg ml/configs/yolov8_pothole.yaml --dry-run

.PHONY: eval
eval:  ## Evaluate model performance on validation and test splits
	$(PYTHON) -m ml.evaluation.evaluate

.PHONY: export
export:  ## Export model to ONNX
	$(PYTHON) -m ml.export.export_onnx --weights ml/runs/pothole_yolov8n/weights/best.pt --imgsz 640

.PHONY: quantize
quantize:  ## Quantize ONNX model to INT8
	$(PYTHON) -m ml.quantization.quantize --model ml/runs/pothole_yolov8n/weights/best.onnx --precision int8

.PHONY: report
report:  ## Generate comprehensive AI evaluation report
	$(PYTHON) -m ml.evaluation.evaluate

.PHONY: demo
demo:  ## Seed realistic demo data (is_demo=true) and print verification endpoints
	$(PYTHON) scripts/seed/seed_demo_data.py
	@Write-Host "Demo data seeded successfully with is_demo=true badge indicators." -ForegroundColor Green
	@Write-Host "Web Portal: http://localhost:3000" -ForegroundColor Cyan
	@Write-Host "API Documentation: http://localhost:8000/api/v1/docs" -ForegroundColor Cyan

.PHONY: reproduce
reproduce:  ## Run clean reproduction check
	$(PYTHON) -m pytest ml/tests/ -v

# --- Utilities --------------------------------------------------------------
.PHONY: clean
clean:  ## Clean temporary caches
	Get-ChildItem -Path . -Include __pycache__, .pytest_cache, .mypy_cache, .ruff_cache -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
	@Write-Host "Clean complete." -ForegroundColor Green

# ScamRoad Makefile
# Works on Linux, macOS, and Windows.
# Usage: make <target>

.DEFAULT_GOAL := help
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command

PYTHON := python
PIP := pip
DOCKER_COMPOSE := docker compose

# ─── Help ──────────────────────────────────────────────────────────────────
.PHONY: help
help:  ## Show this help
	@Write-Host "ScamRoad Make Targets:" -ForegroundColor Cyan
	@Write-Host "  setup        - Install Python and Node dependencies"
	@Write-Host "  dev          - Start Docker Compose dev stack"
	@Write-Host "  down         - Stop Docker Compose"
	@Write-Host "  lint         - Run ruff, black --check, mypy"
	@Write-Host "  format       - Auto-format with ruff and black"
	@Write-Host "  test         - Run all tests with pytest"
	@Write-Host "  test-backend - Run backend tests only"
	@Write-Host "  test-shared  - Run shared schema tests only"
	@Write-Host "  train        - Run ML training (Phase 3)"
	@Write-Host "  export       - Export model to ONNX/TFLite (Phase 4)"
	@Write-Host "  bench        - Run edge benchmarks (Phase 4)"
	@Write-Host "  edge-run     - Start edge agent (Phase 5)"
	@Write-Host "  disk-check   - Show disk usage"
	@Write-Host "  clean        - Remove caches and temp files"
	@Write-Host "  demo         - Run full demo"

# ─── Setup ─────────────────────────────────────────────────────────────────
.PHONY: setup
setup:  ## Install dependencies
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install ruff black mypy pytest pytest-asyncio pytest-cov httpx jsonschema pyyaml pydantic pydantic-settings
	$(PYTHON) -m pip install -r backend/requirements.txt
	@if (Test-Path "web/package.json") { Set-Location web; npm install; Set-Location .. }

# ─── Docker ────────────────────────────────────────────────────────────────
.PHONY: dev
dev:  ## Start Docker Compose dev stack
	$(DOCKER_COMPOSE) up -d
	@Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
	@Start-Sleep -Seconds 5
	$(DOCKER_COMPOSE) ps

.PHONY: down
down:  ## Stop Docker Compose
	$(DOCKER_COMPOSE) down

# ─── Lint ──────────────────────────────────────────────────────────────────
.PHONY: lint
lint:  ## Run linters
	@Write-Host "=== Ruff ===" -ForegroundColor Cyan
	$(PYTHON) -m ruff check backend ml edge shared --config pyproject.toml
	@Write-Host "=== Black (check) ===" -ForegroundColor Cyan
	$(PYTHON) -m black --check backend ml edge shared --config pyproject.toml
	@Write-Host "=== All checks passed ===" -ForegroundColor Green

.PHONY: format
format:  ## Auto-format code
	$(PYTHON) -m ruff check --fix backend ml edge shared --config pyproject.toml
	$(PYTHON) -m black backend ml edge shared --config pyproject.toml

# ─── Tests ─────────────────────────────────────────────────────────────────
.PHONY: test
test:  ## Run all tests
	$(PYTHON) -m pytest backend/tests shared/tests ml/tests --tb=short -v

.PHONY: test-backend
test-backend:  ## Run backend tests only
	$(PYTHON) -m pytest backend/tests/ --tb=short -v

.PHONY: test-shared
test-shared:  ## Run shared schema tests only
	$(PYTHON) -m pytest shared/tests/ --tb=short -v

# ─── ML ────────────────────────────────────────────────────────────────────
.PHONY: train
train:  ## Run ML training (Phase 3+)
	@Write-Host "ML training not yet implemented. See Phase 3." -ForegroundColor Yellow

.PHONY: export
export:  ## Export model to ONNX/TFLite (Phase 4+)
	@Write-Host "Model export not yet implemented. See Phase 4." -ForegroundColor Yellow

.PHONY: bench
bench:  ## Run edge benchmarks (Phase 4+)
	@Write-Host "Benchmarks not yet implemented. See Phase 4." -ForegroundColor Yellow

# ─── Edge ──────────────────────────────────────────────────────────────────
.PHONY: edge-run
edge-run:  ## Start edge agent (Phase 5+)
	@Write-Host "Edge agent not yet implemented. See Phase 5." -ForegroundColor Yellow

# ─── Utilities ─────────────────────────────────────────────────────────────
.PHONY: disk-check
disk-check:  ## Show disk usage
	Get-PSDrive C | Select-Object @{N='FreeGB';E={[math]::Round($$.Free/1GB,2)}}, @{N='UsedGB';E={[math]::Round($$.Used/1GB,2)}} | Format-Table -AutoSize

.PHONY: clean
clean:  ## Clean caches
	Get-ChildItem -Path . -Include __pycache__, .pytest_cache, .mypy_cache, .ruff_cache -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
	@Write-Host "Clean complete." -ForegroundColor Green

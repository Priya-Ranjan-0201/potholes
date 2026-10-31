# ScamRoad PowerShell Task Runner (Windows fallback for make)
# Usage: .\scripts\make.ps1 <target> [args...]

param(
    [Parameter(Position=0)]
    [string]$Target = "help"
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "ScamRoad Make Targets (PowerShell runner):" -ForegroundColor Cyan
    Write-Host "  setup        - Install Python test and lint dependencies"
    Write-Host "  dev          - Start Docker Compose dev stack"
    Write-Host "  down         - Stop Docker Compose"
    Write-Host "  lint         - Run ruff and black checks"
    Write-Host "  format       - Auto-format code with ruff and black"
    Write-Host "  test         - Run all pytest test suites"
    Write-Host "  test-backend - Run backend tests only"
    Write-Host "  test-shared  - Run shared schema contract tests only"
    Write-Host "  disk-check   - Display current drive free space"
    Write-Host "  clean        - Clean python cache files"
}

switch ($Target) {
    "help" {
        Show-Help
    }
    "setup" {
        Write-Host "Upgrading pip..." -ForegroundColor Cyan
        python -m pip install --upgrade pip
        Write-Host "Installing dev/test/lint requirements..." -ForegroundColor Cyan
        python -m pip install ruff black mypy pytest pytest-asyncio pytest-cov httpx jsonschema pyyaml pydantic pydantic-settings
        if (Test-Path "backend/requirements.txt") {
            python -m pip install -r backend/requirements.txt
        }
    }
    "dev" {
        Write-Host "Starting Docker Compose services..." -ForegroundColor Cyan
        docker compose up -d
        Write-Host "Checking service status..." -ForegroundColor Cyan
        docker compose ps
    }
    "down" {
        Write-Host "Stopping Docker Compose services..." -ForegroundColor Cyan
        docker compose down
    }
    "lint" {
        Write-Host "=== Running Ruff Linter ===" -ForegroundColor Cyan
        python -m ruff check backend ml edge shared --config pyproject.toml
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Write-Host "=== Running Black Formatter Check ===" -ForegroundColor Cyan
        python -m black --check backend ml edge shared --config pyproject.toml
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Write-Host "All linter checks passed!" -ForegroundColor Green
    }
    "format" {
        Write-Host "Formatting with Ruff..." -ForegroundColor Cyan
        python -m ruff check --fix backend ml edge shared --config pyproject.toml
        Write-Host "Formatting with Black..." -ForegroundColor Cyan
        python -m black backend ml edge shared --config pyproject.toml
    }
    "test" {
        Write-Host "Running all pytest suites..." -ForegroundColor Cyan
        python -m pytest backend/tests shared/tests ml/tests edge/tests -v --tb=short
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    "test-backend" {
        Write-Host "Running backend tests..." -ForegroundColor Cyan
        python -m pytest backend/tests -v --tb=short
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    "test-shared" {
        Write-Host "Running shared schema contract tests..." -ForegroundColor Cyan
        python -m pytest shared/tests -v --tb=short
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    "train" {
        Write-Host "Running ML Training (Phase 3)..." -ForegroundColor Cyan
        python -m ml.training.train --cfg ml/configs/yolov8_pothole.yaml
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    "train-dry" {
        Write-Host "Dry-running ML Training configuration..." -ForegroundColor Cyan
        python -m ml.training.train --cfg ml/configs/yolov8_pothole.yaml --dry-run
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    "disk-check" {
        Get-PSDrive C | Select-Object @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}}, @{N='UsedGB';E={[math]::Round($_.Used/1GB,2)}} | Format-Table -AutoSize
    }
    "clean" {
        Write-Host "Cleaning __pycache__ and build caches..." -ForegroundColor Cyan
        Get-ChildItem -Path . -Include __pycache__, .pytest_cache, .mypy_cache, .ruff_cache -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Write-Host "Clean complete." -ForegroundColor Green
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Show-Help
        exit 1
    }
}


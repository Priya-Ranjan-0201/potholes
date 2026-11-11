# ScamRoad One-Click Native PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Starting ScamRoad AI Road Defect Detection Platform  " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$Root = $PSScriptRoot

Write-Host "[1/3] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; `$env:PYTHONPATH='.'; python scripts\serve_inference.py"

Write-Host "[2/3] Launching Vite Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\web'; npm run dev"

Write-Host "[3/3] Opening ScamRoad in default browser..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000/scanner"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ScamRoad is now running!" -ForegroundColor Green
Write-Host "   - AI Inference Engine: http://localhost:8000"
Write-Host "   - Interactive Scanner UI: http://localhost:3000/scanner"
Write-Host "========================================================" -ForegroundColor Cyan

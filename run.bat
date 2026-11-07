@echo off
echo ========================================================
echo    Starting ScamRoad AI Road Defect Detection Platform  
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%scam_road" (
    set PROJECT_ROOT=%SCRIPT_DIR%scam_road
) else (
    set PROJECT_ROOT=%SCRIPT_DIR%
)

echo [1/3] Launching FastAPI Backend on http://localhost:8000...
start "ScamRoad AI Backend" cmd /k "cd /d "%PROJECT_ROOT%" && set PYTHONPATH=. && python scripts\serve_inference.py"

echo [2/3] Launching Vite Frontend on http://localhost:3000...
start "ScamRoad Web Frontend" cmd /k "cd /d "%PROJECT_ROOT%\web" && npm run dev"

echo [3/3] Opening ScamRoad in default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000/scanner

echo.
echo ========================================================
echo    ScamRoad is now running!
echo    - AI Inference Engine: http://localhost:8000
echo    - Interactive Scanner UI: http://localhost:3000/scanner
echo ========================================================

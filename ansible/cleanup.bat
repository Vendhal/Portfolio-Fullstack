@echo off
REM Cleanup Portfolio Kubernetes Deployment

echo ==========================================
echo Portfolio K8s Cleanup
echo ==========================================
echo.
echo WARNING: This will delete all Portfolio resources!
echo.

set /p confirm="Are you sure? (yes/no): "

if /i "%confirm%" NEQ "yes" (
    echo Cleanup cancelled.
    pause
    exit /b 0
)

cd /d "%~dp0"

ansible-playbook cleanup.yml --skip-tags prompt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    CLEANUP COMPLETE!
    echo ==========================================
) else (
    echo.
    echo [ERROR] Cleanup failed!
)

echo.
pause

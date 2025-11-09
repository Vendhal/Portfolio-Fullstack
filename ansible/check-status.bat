@echo off
REM Check Portfolio Kubernetes Deployment Status

echo ==========================================
echo Portfolio K8s Status Check
echo ==========================================
echo.

cd /d "%~dp0"

ansible-playbook status.yml

echo.
pause

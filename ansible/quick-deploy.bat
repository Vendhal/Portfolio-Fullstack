@echo off
REM Portfolio Kubernetes Deployment - Quick Deploy Script
REM This script deploys the entire Portfolio stack to Kubernetes using Ansible

echo ==========================================
echo Portfolio K8s Deployment with Ansible
echo ==========================================
echo.

REM Check if Ansible is installed
where ansible-playbook >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ansible is not installed!
    echo.
    echo Install Ansible using pip:
    echo   pip install ansible
    echo.
    echo Or using winget:
    echo   winget install Ansible.Ansible
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

REM Check if kubectl is available
kubectl version --client >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] kubectl is not installed or not in PATH!
    echo.
    pause
    exit /b 1
)

echo [OK] All prerequisites are installed
echo.

REM Change to ansible directory
cd /d "%~dp0"

echo Starting deployment...
echo.

REM Run Ansible playbook
ansible-playbook deploy.yml

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    DEPLOYMENT COMPLETE!
    echo ==========================================
    echo.
    echo Access your application:
    echo   Frontend: http://localhost:30080
    echo   Backend API: http://localhost:30080/api/v1
    echo   Health: http://localhost:30080/api/v1/actuator/health
    echo.
    echo Useful commands:
    echo   Check status: ansible-playbook status.yml
    echo   View logs: kubectl logs -f deployment/backend -n portfolio
    echo   Cleanup: ansible-playbook cleanup.yml
    echo.
) else (
    echo.
    echo [ERROR] Deployment failed! Check the output above for details.
    echo.
    echo Troubleshooting:
    echo   - Check logs: kubectl get pods -n portfolio
    echo   - View events: kubectl get events -n portfolio
    echo   - Run status: ansible-playbook status.yml
    echo.
)

pause

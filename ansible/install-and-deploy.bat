@echo off
REM Portfolio Kubernetes - Ansible Installer & Deployment Script
REM This script checks prerequisites, installs Ansible if needed, and deploys your application

echo ==========================================
echo Portfolio K8s - Ansible Setup
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo.
    echo Python is required to install Ansible.
    echo.
    echo Please install Python from:
    echo   https://www.python.org/downloads/
    echo.
    echo Or use winget:
    echo   winget install Python.Python.3.12
    echo.
    pause
    exit /b 1
)

echo [OK] Python is installed
python --version

REM Check if pip is available
pip --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pip is not installed!
    echo.
    echo Installing pip...
    python -m ensurepip --upgrade
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install pip!
        pause
        exit /b 1
    )
)

echo [OK] pip is available
pip --version

REM Check if Ansible is installed
ansible --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [INFO] Ansible is not installed
    echo.
    set /p install="Would you like to install Ansible now? (yes/no): "
    
    if /i "%install%" NEQ "yes" (
        echo.
        echo Ansible is required for deployment.
        echo Install manually with: pip install ansible
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo Installing Ansible...
    echo This may take a few minutes...
    echo.
    
    pip install ansible
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install Ansible!
        echo.
        echo Try manually:
        echo   pip install ansible
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo [OK] Ansible installed successfully!
) else (
    echo [OK] Ansible is already installed
)

echo.
ansible --version

REM Check if Docker is running
echo.
echo Checking Docker...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running

REM Check if kubectl is available
echo.
echo Checking kubectl...
kubectl version --client >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] kubectl is not installed or not in PATH!
    echo.
    echo kubectl comes with Docker Desktop.
    echo Make sure Kubernetes is enabled in Docker Desktop settings.
    echo.
    pause
    exit /b 1
)

echo [OK] kubectl is available

REM Check Kubernetes cluster
echo.
echo Checking Kubernetes cluster...
kubectl cluster-info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Kubernetes cluster is not accessible!
    echo.
    echo Please make sure:
    echo   1. Docker Desktop is running
    echo   2. Kubernetes is enabled (Settings -^> Kubernetes)
    echo   3. kubectl context is set to docker-desktop
    echo.
    set /p continue="Continue anyway? (yes/no): "
    
    if /i "%continue%" NEQ "yes" (
        echo.
        echo Setup cancelled.
        pause
        exit /b 1
    )
) else (
    echo [OK] Kubernetes cluster is accessible
)

echo.
echo ==========================================
echo    All Prerequisites Satisfied!
echo ==========================================
echo.
echo ✓ Python installed
echo ✓ pip installed
echo ✓ Ansible installed
echo ✓ Docker running
echo ✓ kubectl available
echo ✓ Kubernetes cluster ready
echo.
echo ==========================================
echo.

set /p deploy="Would you like to deploy now? (yes/no): "

if /i "%deploy%" EQU "yes" (
    echo.
    echo Starting deployment...
    echo.
    
    cd /d "%~dp0"
    
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
    ) else (
        echo.
        echo [ERROR] Deployment failed!
        echo Check the output above for details.
        echo.
    )
) else (
    echo.
    echo Setup complete! To deploy later, run:
    echo   cd ansible
    echo   ansible-playbook deploy.yml
    echo.
    echo Or double-click: quick-deploy.bat
    echo.
)

pause

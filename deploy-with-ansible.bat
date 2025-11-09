@echo off
REM Deploy Portfolio using Ansible in WSL Ubuntu

echo ==========================================
echo  Portfolio Ansible Deployment (WSL)
echo ==========================================
echo.

REM Check if WSL is available
wsl --status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] WSL is not installed or not running
    echo Please install WSL: wsl --install
    pause
    exit /b 1
)

echo [INFO] Running Ansible deployment in Ubuntu...
echo.

REM Run the bash script in WSL
wsl bash /mnt/c/Users/saisa.DESKTOP-IRA1I5U/Desktop/Portfolio-fullstack/deploy-ansible-wsl.sh

pause

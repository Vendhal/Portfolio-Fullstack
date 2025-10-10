@echo off
REM Production Deployment Script for Windows
REM Usage: deploy-production.bat

echo 🚀 Starting Production Deployment...

REM Configuration
set COMPOSE_FILE=docker-compose.production.yml
set ENV_FILE=.env.production

REM Check if environment file exists
if not exist "%ENV_FILE%" (
    echo ❌ Error: %ENV_FILE% not found!
    echo Please copy .env.production.example to .env.production and configure it.
    exit /b 1
)

echo 📋 Checking prerequisites...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running!
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: docker-compose is not installed!
    exit /b 1
)

echo 🔧 Building and starting services...

REM Pull latest images
docker-compose -f %COMPOSE_FILE% pull

REM Build and start services
docker-compose -f %COMPOSE_FILE% up -d --build --remove-orphans

echo ⏳ Waiting for services to be ready...

REM Wait for services (simplified for Windows)
timeout /t 30 /nobreak

echo 🧪 Running health checks...

REM Check backend health
curl -f http://localhost:8080/actuator/health
if errorlevel 1 (
    echo ❌ Backend health check failed!
    exit /b 1
)

REM Check frontend
curl -f http://localhost:80/
if errorlevel 1 (
    echo ❌ Frontend health check failed!
    exit /b 1
)

echo 🧹 Cleaning up old images...
docker image prune -f

echo 📊 Deployment Status:
docker-compose -f %COMPOSE_FILE% ps

echo ✅ Production deployment completed successfully!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:80
echo    Backend API: http://localhost:8080/api
echo    Health Check: http://localhost:8080/actuator/health
echo.
echo 📝 To view logs:
echo    docker-compose -f %COMPOSE_FILE% logs -f
echo.
echo 🛑 To stop services:
echo    docker-compose -f %COMPOSE_FILE% down

pause
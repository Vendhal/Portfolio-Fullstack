@echo off
REM Portfolio Full-Stack Deployment Script for Windows
REM This script deploys the application using Docker Compose

echo 🚀 Starting Portfolio Full-Stack Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Pull latest images
echo 📦 Pulling latest Docker images...
docker compose -f docker-compose.production.yml pull

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker compose -f docker-compose.production.yml down

REM Start services
echo 🚀 Starting services...
docker compose -f docker-compose.production.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Health check
echo 🔍 Performing health check...
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Deployment successful! Application is running at http://localhost
) else (
    echo ❌ Health check failed. Checking logs...
    docker compose -f docker-compose.production.yml logs
    exit /b 1
)

REM Display running containers
echo 📊 Running containers:
docker compose -f docker-compose.production.yml ps

echo 🎉 Deployment completed successfully!
echo 🌐 Frontend: http://localhost
echo 🔧 Backend API: http://localhost/api
echo 📊 Health Check: http://localhost/health
pause
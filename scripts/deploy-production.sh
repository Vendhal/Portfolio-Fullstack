#!/bin/bash

# Production Deployment Script
# Usage: ./deploy-production.sh

set -e

echo "🚀 Starting Production Deployment..."

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '#' | xargs)

echo "📋 Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed!"
    exit 1
fi

echo "🔧 Building and starting services..."

# Pull latest images
docker-compose -f $COMPOSE_FILE pull

# Build and start services
docker-compose -f $COMPOSE_FILE up -d --build --remove-orphans

echo "⏳ Waiting for services to be ready..."

# Wait for database to be ready
echo "Waiting for database..."
until docker-compose -f $COMPOSE_FILE exec -T db pg_isready -U $DB_USER -d $DB_NAME; do
    sleep 2
done

# Wait for backend to be ready
echo "Waiting for backend..."
until curl -f http://localhost:${BACKEND_PORT:-8080}/actuator/health > /dev/null 2>&1; do
    sleep 5
done

# Wait for frontend to be ready
echo "Waiting for frontend..."
until curl -f http://localhost:${FRONTEND_PORT:-80}/ > /dev/null 2>&1; do
    sleep 2
done

echo "🧪 Running health checks..."

# Check all services
BACKEND_HEALTH=$(curl -s http://localhost:${BACKEND_PORT:-8080}/actuator/health | jq -r '.status')
if [ "$BACKEND_HEALTH" != "UP" ]; then
    echo "❌ Backend health check failed!"
    exit 1
fi

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${FRONTEND_PORT:-80}/)
if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "❌ Frontend health check failed!"
    exit 1
fi

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "📊 Deployment Status:"
docker-compose -f $COMPOSE_FILE ps

echo "✅ Production deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "   Backend API: http://localhost:${BACKEND_PORT:-8080}/api"
echo "   Health Check: http://localhost:${BACKEND_PORT:-8080}/actuator/health"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f $COMPOSE_FILE down"
#!/bin/bash

# Portfolio Full-Stack Deployment Script
# This script deploys the application using Docker Compose

set -e

echo "🚀 Starting Portfolio Full-Stack Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker compose -f docker-compose.production.yml pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.production.yml down

# Start services
echo "🚀 Starting services..."
docker compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is running at http://localhost"
else
    echo "❌ Health check failed. Checking logs..."
    docker compose -f docker-compose.production.yml logs
    exit 1
fi

# Display running containers
echo "📊 Running containers:"
docker compose -f docker-compose.production.yml ps

echo "🎉 Deployment completed successfully!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost/api"
echo "📊 Health Check: http://localhost/health"
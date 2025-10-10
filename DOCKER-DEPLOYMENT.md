# 🐳 Docker Deployment Guide

## Quick Start

### Local Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Copy environment configuration
cp .env.production.example .env.production

# Edit production environment variables
nano .env.production

# Deploy to production
./scripts/deploy-production.sh
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │     Backend     │
│  Load Balancer  │───▶│   React App     │───▶│   Spring Boot   │
│   (Port 80/443) │    │   (Port 80)     │    │   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              ┌─────────────────┐            │
         └──────────────▶│   PostgreSQL    │◀───────────┘
                        │   (Port 5432)   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Port 6379)   │
                        └─────────────────┘
```

## Services

### 🖥️ Frontend (React + TypeScript)
- **Image**: `nginx:alpine` with optimized configuration
- **Port**: 80 (HTTP), 443 (HTTPS)
- **Features**: 
  - PWA support
  - Static asset caching
  - Client-side routing
  - Security headers

### ⚙️ Backend (Spring Boot)
- **Image**: `eclipse-temurin:17-jre-alpine`
- **Port**: 8080
- **Features**:
  - JWT authentication
  - RESTful API
  - Health checks
  - Metrics & monitoring
  - Cache management

### 🗄️ Database (PostgreSQL)
- **Image**: `postgres:16-alpine`
- **Port**: 5432
- **Features**:
  - Persistent volumes
  - Health checks
  - Optimized configuration

### 🚀 Load Balancer (Nginx)
- **Image**: `nginx:alpine`
- **Ports**: 80, 443
- **Features**:
  - SSL termination
  - Rate limiting
  - Security headers
  - Static asset caching

### 📦 Cache (Redis)
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Features**:
  - Session storage
  - Application caching
  - Persistence

## Environment Configuration

### Development (.env)
```env
DB_PASSWORD=dev_password
JWT_SECRET=dev_secret_key
REDIS_PASSWORD=dev_redis_password
```

### Production (.env.production)
```env
# Database
DB_NAME=portfolio
DB_USER=portfolio_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_chars
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000

# Redis
REDIS_PASSWORD=your_secure_redis_password

# URLs
VITE_API_BASE_URL=https://yourapp.com/api
CORS_ALLOWED_ORIGINS=https://yourapp.com

# Ports
FRONTEND_PORT=80
BACKEND_PORT=8080
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Tests** - Runs unit and integration tests
2. **Security Scan** - Scans for vulnerabilities  
3. **Build** - Creates optimized Docker images
4. **Push** - Pushes images to GitHub Container Registry
5. **Deploy** - Deploys to staging/production

### Required Secrets

Configure these in your GitHub repository settings:

```
PROD_HOST=your.production.server.com
PROD_USER=deploy_user
PROD_SSH_KEY=your_private_ssh_key

STAGING_HOST=your.staging.server.com
STAGING_USER=deploy_user
STAGING_SSH_KEY=your_staging_ssh_key
```

## Deployment Options

### 1. Cloud Platform (Recommended)

#### AWS ECS
```bash
# Install AWS CLI and configure
aws configure

# Deploy using ECS
aws ecs create-cluster --cluster-name portfolio-cluster
```

#### Azure Container Instances
```bash
# Login to Azure
az login

# Create resource group
az group create --name portfolio-rg --location eastus

# Deploy containers
az container create --resource-group portfolio-rg \
  --name portfolio-app \
  --image ghcr.io/vendhal/portfolio-fullstack-backend:latest
```

#### Google Cloud Run
```bash
# Authenticate
gcloud auth login

# Deploy service
gcloud run deploy portfolio-backend \
  --image ghcr.io/vendhal/portfolio-fullstack-backend:latest \
  --platform managed
```

### 2. VPS Deployment

#### DigitalOcean Droplet
```bash
# SSH to your droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/Vendhal/Portfolio-Fullstack.git
cd Portfolio-Fullstack

# Deploy
./scripts/deploy-production.sh
```

#### AWS EC2
```bash
# Launch EC2 instance with Docker
# SSH to instance
ssh -i your-key.pem ec2-user@your-ec2-instance

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy application
git clone https://github.com/Vendhal/Portfolio-Fullstack.git
cd Portfolio-Fullstack
sudo ./scripts/deploy-production.sh
```

### 3. Kubernetes Deployment

#### Local Kubernetes (minikube)
```bash
# Start minikube
minikube start

# Apply configurations
kubectl apply -f k8s/
```

#### Production Kubernetes
```bash
# Create namespace
kubectl create namespace portfolio

# Apply configurations
kubectl apply -f k8s/ -n portfolio

# Check status
kubectl get pods -n portfolio
```

## Monitoring & Logging

### Health Checks
- Frontend: `http://localhost:80/`
- Backend: `http://localhost:8080/actuator/health`
- Database: Built-in PostgreSQL health check
- Redis: Built-in Redis health check

### Logs
```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### Metrics
- Backend metrics: `http://localhost:8080/actuator/metrics`
- Prometheus endpoint: `http://localhost:8080/actuator/prometheus`

## Security

### SSL/TLS
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `nginx/ssl/`
3. Update nginx configuration

### Firewall
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 5432   # Database (internal only)
ufw deny 6379   # Redis (internal only)
ufw deny 8080   # Backend (internal only)
```

### Environment Security
- Use strong passwords
- Rotate JWT secrets regularly
- Enable Docker security scanning
- Regular security updates

## Scaling

### Horizontal Scaling
```yaml
# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Use load balancer
nginx:
  upstream backend {
    server backend_1:8080;
    server backend_2:8080;
    server backend_3:8080;
  }
```

### Database Scaling
- Read replicas for PostgreSQL
- Connection pooling
- Database clustering

## Troubleshooting

### Common Issues

#### Container won't start
```bash
# Check logs
docker-compose logs service_name

# Check resource usage
docker stats

# Recreate container
docker-compose up -d --force-recreate service_name
```

#### Database connection issues
```bash
# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend nc -zv db 5432
```

#### Memory issues
```bash
# Increase memory limits in docker-compose.production.yml
deploy:
  resources:
    limits:
      memory: 1G
```

### Performance Optimization

#### Database
```sql
-- Create indexes
CREATE INDEX idx_user_email ON app_user(email);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);
```

#### Application
```properties
# JVM tuning
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC
```

#### Frontend
- Enable gzip compression
- CDN for static assets
- Browser caching headers

## Backup & Recovery

### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U portfolio_user portfolio > backup.sql

# Restore backup
docker-compose exec -T db psql -U portfolio_user portfolio < backup.sql
```

### Application Backup
```bash
# Backup volumes
docker run --rm -v portfolio_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz /data
```

## Support

For issues and questions:
- 📧 Email: support@yourapp.com
- 🐛 Issues: [GitHub Issues](https://github.com/Vendhal/Portfolio-Fullstack/issues)
- 📖 Documentation: [Wiki](https://github.com/Vendhal/Portfolio-Fullstack/wiki)
# 🚀 Portfolio Full-Stack Deployment Guide

## ⚡ FASTEST WAY - Ansible + Kubernetes (NEW!)

### Windows ONE-CLICK Deploy

```bash
cd ansible
quick-deploy.bat  # Double-click this file!
```

**What it does:**
- ✅ Checks prerequisites
- ✅ Deploys to Kubernetes
- ✅ Auto-scales (2 backend + 3 frontend pods)
- ✅ Production-ready in 5-10 minutes

**Access:** http://localhost:30080

📖 **Full Guide:** See `ANSIBLE-DEPLOYMENT.md`

---

## Quick Start Deployment

### Option 1: Using Deployment Scripts (Recommended)

**For Windows:**
```bash
.\deploy.bat
```

**For Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Docker Compose

```bash
# Pull and start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs

# Stop services
docker compose -f docker-compose.production.yml down
```

## 🔗 Access Your Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost/api
- **Health Check:** http://localhost/health
- **API Documentation:** http://localhost/api/swagger-ui.html

## 🎯 CI/CD Pipeline Status

The GitHub Actions pipeline now includes:

✅ **Backend Testing** - Maven tests with JaCoCo coverage  
✅ **Frontend Testing** - Vitest tests with build verification  
✅ **Security Scanning** - Trivy vulnerability scanner  
✅ **Docker Building** - Automated image building and pushing  

## 📊 Production Architecture

```
Internet → Nginx Load Balancer → Frontend/Backend
                ↓
            PostgreSQL Database
                ↓
            Redis Cache
```

## 🔧 Environment Configuration

Create `.env.production` with your production values:

```env
# Database
POSTGRES_DB=portfolio_prod
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=your_secure_password

# Backend
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=86400000

# Redis
REDIS_PASSWORD=your_redis_password
```

## 🛡️ Security Features

- **SSL/TLS Termination** at Nginx
- **Rate Limiting** to prevent abuse
- **Security Headers** (HSTS, CSP, etc.)
- **Non-root Containers** for better security
- **Network Isolation** between services
- **Automated Security Scanning** in CI/CD

## 📈 Monitoring & Health Checks

- **Application Health:** `/health` endpoint
- **Database Health:** Built-in PostgreSQL monitoring
- **Redis Health:** Connection monitoring
- **Nginx Status:** Access logs and metrics

## 🔄 Deployment Workflow

1. **Development** → Push to `develop` branch
2. **Testing** → CI/CD runs automated tests
3. **Security** → Vulnerability scanning
4. **Building** → Docker images built and pushed
5. **Production** → Manual deployment using scripts

## 🚨 Troubleshooting

**If containers fail to start:**
```bash
docker compose -f docker-compose.production.yml logs
```

**If health check fails:**
```bash
curl -v http://localhost/health
```

**Reset everything:**
```bash
docker compose -f docker-compose.production.yml down -v
docker system prune -a
```

## 🎉 Success!

Your full-stack portfolio is now production-ready with:
- ✅ Complete Docker containerization
- ✅ CI/CD pipeline automation
- ✅ Production-grade configuration
- ✅ Security best practices
- ✅ Monitoring and health checks
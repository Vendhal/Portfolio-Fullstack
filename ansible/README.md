# Portfolio Kubernetes Deployment with Ansible

Complete Ansible automation for deploying the Portfolio full-stack application to Kubernetes.

## 📋 Prerequisites

1. **Docker Desktop** - Running with Kubernetes enabled
2. **Ansible** - Version 2.9 or higher
3. **kubectl** - Kubernetes command-line tool

### Install Ansible (Windows)

```powershell
# Using pip
pip install ansible

# Or using winget
winget install Ansible.Ansible
```

## 🚀 Quick Start

### 1. Deploy Everything

```bash
cd ansible
ansible-playbook deploy.yml
```

This will:
- ✅ Create Kubernetes namespace
- ✅ Deploy PostgreSQL database
- ✅ Build and deploy backend (Spring Boot)
- ✅ Build and deploy frontend (React)
- ✅ Configure services and ingress
- ✅ Wait for all pods to be ready

### 2. Check Status

```bash
ansible-playbook status.yml
```

### 3. Build Images Only

```bash
ansible-playbook build.yml
```

### 4. Clean Up

```bash
ansible-playbook cleanup.yml
```

## 📁 Structure

```
ansible/
├── ansible.cfg              # Ansible configuration
├── inventory.yml            # Host inventory (localhost)
├── deploy.yml               # Main deployment playbook
├── status.yml               # Status check playbook
├── build.yml                # Build images playbook
├── cleanup.yml              # Cleanup playbook
├── vars/
│   └── config.yml           # Configuration variables
└── roles/
    ├── kubernetes/          # Namespace setup
    ├── database/            # PostgreSQL deployment
    ├── backend/             # Backend deployment
    └── frontend/            # Frontend deployment
```

## ⚙️ Configuration

Edit `vars/config.yml` to customize:

```yaml
# Kubernetes Configuration
k8s_namespace: portfolio
k8s_context: docker-desktop

# Images
backend_image: ghcr.io/vendhal/portfolio-fullstack-backend
frontend_image: ghcr.io/vendhal/portfolio-fullstack-frontend
image_tag: fixed

# Resources
backend_replicas: 2
frontend_replicas: 3

# Database
postgres_user: portfolio_user
postgres_password: portfolio_password
postgres_db: portfolio
```

## 🎯 Deployment Options

### Deploy specific components

```bash
# Deploy only database
ansible-playbook deploy.yml --tags database

# Deploy only backend
ansible-playbook deploy.yml --tags backend

# Deploy only frontend
ansible-playbook deploy.yml --tags frontend

# Deploy database and backend
ansible-playbook deploy.yml --tags database,backend
```

### Skip components

```bash
# Skip frontend deployment
ansible-playbook deploy.yml --skip-tags frontend
```

### Verbose output

```bash
ansible-playbook deploy.yml -v    # Verbose
ansible-playbook deploy.yml -vv   # More verbose
ansible-playbook deploy.yml -vvv  # Very verbose
```

## 🔍 Useful Commands

### Check deployment

```bash
# Quick status
ansible-playbook status.yml

# Detailed status with Ansible
ansible-playbook status.yml -v

# Direct kubectl
kubectl get all -n portfolio
```

### View logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n portfolio

# Frontend logs
kubectl logs -f deployment/frontend -n portfolio

# Database logs
kubectl logs -f deployment/postgres -n portfolio
```

### Access application

```bash
# Get NodePort
kubectl get service portfolio-nodeport -n portfolio

# Frontend: http://localhost:30080
# Backend API: http://localhost:30080/api/v1
# Health Check: http://localhost:30080/api/v1/actuator/health
```

## 🐛 Troubleshooting

### Backend not starting

```bash
# Check logs
kubectl logs -l app=backend -n portfolio --tail=100

# Describe pod
kubectl describe pod -l app=backend -n portfolio

# Check events
kubectl get events -n portfolio --sort-by='.lastTimestamp'
```

### Database connection issues

```bash
# Check database
kubectl exec -it deployment/postgres -n portfolio -- psql -U portfolio_user -d portfolio

# Test connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -n portfolio -- psql -h postgres-service -U portfolio_user -d portfolio
```

### Image pull errors

```bash
# Use local images
# Edit k8s/backend.yaml and k8s/frontend.yaml
# Add: imagePullPolicy: Never

# Rebuild images
ansible-playbook build.yml
```

## 🔄 Redeployment

### Full redeployment

```bash
# Clean up
ansible-playbook cleanup.yml

# Deploy again
ansible-playbook deploy.yml
```

### Rolling update

```bash
# Rebuild images
ansible-playbook build.yml

# Apply changes
kubectl rollout restart deployment/backend -n portfolio
kubectl rollout restart deployment/frontend -n portfolio
```

## 🛡️ Security Notes

**⚠️ IMPORTANT:** Default secrets are for development only!

For production:

1. Change passwords in `vars/config.yml`
2. Use Kubernetes secrets for sensitive data
3. Enable TLS/HTTPS
4. Configure proper RBAC

## 📊 Health Checks

```bash
# Backend health
curl http://localhost:30080/api/v1/actuator/health

# Frontend
curl http://localhost:30080

# Database
kubectl exec -it deployment/postgres -n portfolio -- pg_isready
```

## 🎓 Learning Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

## 🤝 Support

If you encounter issues:

1. Check logs: `ansible-playbook status.yml`
2. View pod status: `kubectl get pods -n portfolio`
3. Check events: `kubectl get events -n portfolio`
4. Review configuration: `cat vars/config.yml`

## 📝 Notes

- **Zero Downtime**: Uses rolling updates
- **Auto-Scaling**: Can be configured via HPA
- **Persistence**: Database data persists across restarts
- **Monitoring**: Health checks and readiness probes included
- **Safe**: No existing files are modified during deployment

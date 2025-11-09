# 🚀 Quick Start Guide - Ansible Deployment

## ⚡ ONE-CLICK DEPLOYMENT

### Windows Users (EASIEST!)

Simply double-click:
```
📁 ansible/quick-deploy.bat
```

### Command Line Users

```bash
cd ansible
ansible-playbook deploy.yml
```

---

## 📋 What You Need

Before starting, make sure you have:

1. ✅ **Docker Desktop** - Running with Kubernetes enabled
2. ✅ **Ansible** - Installed via `pip install ansible`
3. ✅ **kubectl** - Comes with Docker Desktop

---

## 🎯 Available Scripts

All scripts are in the `ansible/` folder:

| Script | What It Does |
|--------|--------------|
| `quick-deploy.bat` | 🚀 Deploy everything (ONE-CLICK!) |
| `check-status.bat` | 📊 Check deployment status |
| `cleanup.bat` | 🗑️ Remove all resources |

---

## 🔧 Manual Deployment Steps

### Step 1: Install Ansible

```powershell
# Using pip (Recommended)
pip install ansible

# Or using winget
winget install Ansible.Ansible

# Verify installation
ansible --version
```

### Step 2: Start Docker Desktop

Make sure:
- ✅ Docker Desktop is running
- ✅ Kubernetes is enabled (Settings → Kubernetes → Enable Kubernetes)
- ✅ kubectl context is `docker-desktop`

```powershell
# Verify Docker
docker info

# Verify Kubernetes
kubectl cluster-info
kubectl config current-context  # Should show "docker-desktop"
```

### Step 3: Deploy

```bash
cd ansible
ansible-playbook deploy.yml
```

**This will:**
1. Create namespace `portfolio`
2. Deploy PostgreSQL database
3. Build & deploy backend (Spring Boot API)
4. Build & deploy frontend (React app)
5. Configure services & networking
6. Wait for everything to be ready

**Time:** ~5-10 minutes (depending on your system)

### Step 4: Access Your Application

After deployment completes:

- **Frontend**: http://localhost:30080
- **Backend API**: http://localhost:30080/api/v1
- **Health Check**: http://localhost:30080/api/v1/actuator/health

---

## 📊 Check Status

```bash
# Quick status
cd ansible
ansible-playbook status.yml

# Or use kubectl directly
kubectl get all -n portfolio
kubectl get pods -n portfolio
```

---

## 🔍 View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n portfolio

# Frontend logs
kubectl logs -f deployment/frontend -n portfolio

# Database logs
kubectl logs -f deployment/postgres -n portfolio

# All logs
kubectl logs -f -l app -n portfolio
```

---

## 🗑️ Cleanup

### Using Script (Windows)

Double-click: `cleanup.bat`

### Using Ansible

```bash
cd ansible
ansible-playbook cleanup.yml
```

This removes **EVERYTHING**:
- All pods, services, deployments
- ConfigMaps and secrets
- The entire `portfolio` namespace

---

## 🎯 Advanced Usage

### Deploy Specific Components

```bash
# Deploy only database
ansible-playbook deploy.yml --tags database

# Deploy only backend
ansible-playbook deploy.yml --tags backend

# Deploy only frontend
ansible-playbook deploy.yml --tags frontend

# Deploy database + backend
ansible-playbook deploy.yml --tags database,backend
```

### Skip Components

```bash
# Skip frontend
ansible-playbook deploy.yml --skip-tags frontend

# Skip database (use existing)
ansible-playbook deploy.yml --skip-tags database
```

### Build Images Only

```bash
ansible-playbook build.yml
```

This builds Docker images without deploying to Kubernetes.

### Verbose Output

```bash
# Verbose
ansible-playbook deploy.yml -v

# More verbose
ansible-playbook deploy.yml -vv

# Debug level
ansible-playbook deploy.yml -vvv
```

---

## ⚙️ Configuration

Edit `ansible/vars/config.yml` to customize:

```yaml
# Change number of replicas
backend_replicas: 2
frontend_replicas: 3

# Change image versions
image_tag: latest

# Change database credentials
postgres_user: myuser
postgres_password: mypassword
postgres_db: mydb

# Change resource limits
backend_memory_limit: "1Gi"
frontend_memory_limit: "256Mi"
```

After changing config:

```bash
# Redeploy
ansible-playbook deploy.yml
```

---

## 🐛 Troubleshooting

### Problem: "Ansible not found"

**Solution:**
```powershell
pip install ansible
# Or
winget install Ansible.Ansible
```

### Problem: "Docker is not running"

**Solution:**
1. Start Docker Desktop
2. Wait for it to be fully running
3. Try again

### Problem: "Kubernetes cluster not available"

**Solution:**
1. Open Docker Desktop
2. Settings → Kubernetes
3. Enable Kubernetes
4. Wait for it to start (green icon)

### Problem: Backend pods in CrashLoopBackOff

**Solution:**
```bash
# Check logs
kubectl logs -l app=backend -n portfolio --tail=100

# Common fixes:
# 1. Database not ready - wait a bit longer
# 2. Wrong credentials - check config.yml
# 3. Image pull error - rebuild: ansible-playbook build.yml
```

### Problem: Can't access frontend

**Solution:**
```bash
# Check NodePort
kubectl get service portfolio-nodeport -n portfolio

# Should show:
# PORT(S): 80:30080/TCP

# Access at: http://localhost:30080
```

### Problem: Database connection refused

**Solution:**
```bash
# Check database pod
kubectl get pod -l app=postgres -n portfolio

# Should show: STATUS: Running

# Test connection
kubectl exec -it deployment/postgres -n portfolio -- psql -U portfolio_user -d portfolio
```

---

## 🔄 Redeployment

### Full Redeployment

```bash
# Clean everything
ansible-playbook cleanup.yml

# Deploy fresh
ansible-playbook deploy.yml
```

### Rolling Update

```bash
# Rebuild images
ansible-playbook build.yml

# Restart deployments
kubectl rollout restart deployment/backend -n portfolio
kubectl rollout restart deployment/frontend -n portfolio

# Watch rollout
kubectl rollout status deployment/backend -n portfolio
kubectl rollout status deployment/frontend -n portfolio
```

---

## 📈 Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n portfolio

# Scale frontend
kubectl scale deployment frontend --replicas=10 -n portfolio

# Auto-scale (optional)
kubectl autoscale deployment backend --min=2 --max=10 --cpu-percent=80 -n portfolio
```

---

## 🎓 Next Steps

After successful deployment:

1. ✅ **Test the application** - http://localhost:30080
2. ✅ **Check API health** - http://localhost:30080/api/v1/actuator/health
3. ✅ **Monitor logs** - `kubectl logs -f deployment/backend -n portfolio`
4. ✅ **Customize config** - Edit `vars/config.yml`
5. ✅ **Set up CI/CD** - Use GitHub Actions with Ansible

---

## 💡 Pro Tips

1. **Save time**: Use `quick-deploy.bat` for fast deployments
2. **Check first**: Run `check-status.bat` before deploying
3. **Clean slate**: Use `cleanup.bat` if things go wrong
4. **Watch pods**: `kubectl get pods -n portfolio -w` (live updates)
5. **Quick logs**: `kubectl logs -f deployment/backend -n portfolio --tail=50`

---

## 📚 Additional Resources

- [Full README](README.md) - Complete documentation
- [Ansible Docs](https://docs.ansible.com/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Docker Desktop](https://docs.docker.com/desktop/)

---

## ✅ Success Checklist

After deployment, you should see:

- ✅ Namespace `portfolio` created
- ✅ 1 PostgreSQL pod running
- ✅ 2 Backend pods running
- ✅ 3 Frontend pods running
- ✅ All pods showing `STATUS: Running`
- ✅ Frontend accessible at http://localhost:30080
- ✅ Backend health check passing

**Congratulations! Your full-stack application is now running on Kubernetes!** 🎉

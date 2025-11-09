# 🚀 Quick Deployment Reference

## 🎯 You Have 3 Deployment Options

### **Option 1: Kubernetes with Ansible** ⭐ RECOMMENDED (Production-Ready)

**ONE-CLICK Windows Deploy:**
```bash
cd ansible
quick-deploy.bat  # Just double-click this!
```

**OR Command Line:**
```bash
cd ansible
ansible-playbook deploy.yml
```

**Features:**
- ✅ Auto-scaling (2 backend + 3 frontend pods)
- ✅ Rolling updates
- ✅ Health checks
- ✅ Resource limits
- ✅ Production-ready in 5-10 minutes

**Access:** http://localhost:30080

**Prerequisites:**
- Docker Desktop (with Kubernetes enabled)
- Ansible: `pip install ansible`
- kubectl (comes with Docker Desktop)

**Other Commands:**
```bash
cd ansible
check-status.bat    # Check deployment status
cleanup.bat         # Remove all resources
```

---

### **Option 2: Docker Compose (Development)**

**Quick Start:**
```bash
docker compose up -d --build
```

**Access:** http://localhost:3000

**Features:**
- ✅ Simple setup
- ✅ Perfect for development
- ✅ Fast iteration

**Stop:**
```bash
docker compose down
```

---

### **Option 3: Docker Compose Production**

**Deploy:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**Access:** http://localhost

**Features:**
- ✅ Production optimized
- ✅ Restart policies
- ✅ Environment-specific configs

---

## 📊 Quick Comparison

| Feature | Docker Compose (Dev) | Docker Compose (Prod) | Kubernetes + Ansible |
|---------|---------------------|----------------------|---------------------|
| **Setup Time** | 2 mins | 5 mins | 5-10 mins |
| **Complexity** | Low | Medium | Medium |
| **Production Ready** | ❌ | ✅ | ✅✅ |
| **Auto-Scaling** | ❌ | ❌ | ✅ |
| **Rolling Updates** | ❌ | ❌ | ✅ |
| **Health Checks** | Basic | Basic | Advanced |
| **Best For** | Development | Small Production | Enterprise Production |

---

## 🎯 Recommended Path

1. **Start with Option 2** (Docker Compose Dev) for quick testing
2. **Move to Option 1** (Kubernetes + Ansible) for production deployment
3. **Use Option 3** (Docker Compose Prod) if you prefer Docker Compose over Kubernetes

---

## 📝 Current Setup Status

✅ **Docker Images Built:**
- `portfolio-backend:latest` (469MB)
- `portfolio-frontend:latest` (86MB)

✅ **Kubernetes Manifests:**
- Located in `k8s/` directory
- 8 clean YAML files (no duplicates)

✅ **Ansible Automation:**
- Located in `ansible/` directory
- 4 batch scripts + complete roles structure

✅ **Documentation:**
- Full guide: `ANSIBLE-DEPLOYMENT.md`
- Deployment guide: `DEPLOYMENT-GUIDE.md`
- Main README: `README.md`

---

## 🆘 Quick Troubleshooting

**Kubernetes cluster not running?**
- Docker Desktop → Settings → Kubernetes → Enable Kubernetes

**Port already in use?**
- Check: `netstat -ano | findstr :30080`
- Or change ports in `ansible/vars/config.yml`

**Images not found?**
- Build manually: `docker build -t portfolio-backend:latest ./backend`
- Build manually: `docker build -t portfolio-frontend:latest ./frontend`

**Check logs:**
```bash
# Kubernetes
kubectl logs -f deployment/backend -n portfolio

# Docker Compose
docker compose logs -f backend
```

---

## 📞 Need Help?

Check these files:
- `ANSIBLE-DEPLOYMENT.md` - Full Ansible guide
- `DEPLOYMENT-GUIDE.md` - General deployment guide
- `DEVELOPMENT.md` - Development setup
- `README.md` - Project overview

---

**🎉 Ready to deploy? Just run:** `cd ansible && quick-deploy.bat`

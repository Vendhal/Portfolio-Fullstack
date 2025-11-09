# Portfolio Kubernetes Management

This folder contains everything you need to deploy and manage your portfolio on Kubernetes - just like your neat Docker container structure!

## 🚀 Quick Start

### Windows Users:
```cmd
# Deploy everything
scripts\k8s-deploy.bat

# Check status & access
scripts\k8s-status.bat

# Stop everything  
scripts\k8s-stop.bat
```

### Linux/Mac Users:
```bash
# Deploy everything
./scripts/k8s-deploy.sh

# Stop everything
./scripts/k8s-stop.sh
```

## 📁 Structure

```
📦 Portfolio-Fullstack/
├── 🗂️ k8s/                    # Kubernetes manifests
│   ├── namespace.yaml         # Portfolio namespace
│   ├── postgres.yaml          # Database deployment
│   ├── backend.yaml           # Spring Boot API
│   ├── frontend.yaml          # React app
│   └── ingress.yaml           # Load balancer
├── 🗂️ scripts/               # One-click deployment
│   ├── k8s-deploy.bat         # 🟢 START everything
│   ├── k8s-status.bat         # 📊 CHECK status
│   └── k8s-stop.bat           # 🛑 STOP everything
└── 📖 README.md
```

## 🎯 What Gets Deployed

| Service | Replicas | Purpose |
|---------|----------|---------|
| 🗄️ PostgreSQL | 1 | Database with persistent storage |
| ⚙️ Backend | 2 | Spring Boot API with health checks |
| 🎨 Frontend | 3 | React app with Nginx |
| 🌐 Networking | - | Load balancer & service discovery |

## 🔗 Access Your Portfolio

After deployment:
1. Run: `kubectl port-forward -n portfolio svc/frontend-service 3000:80`
2. Visit: **http://localhost:3000**

## 📊 Monitoring Commands

```bash
# Quick status
kubectl get all -n portfolio

# Watch pods
kubectl get pods -n portfolio -w

# View logs
kubectl logs -f deployment/frontend -n portfolio
kubectl logs -f deployment/backend -n portfolio

# Scale services
kubectl scale deployment frontend --replicas=5 -n portfolio
kubectl scale deployment backend --replicas=3 -n portfolio
```

## 🛠️ Troubleshooting

### If pods are stuck:
```bash
kubectl describe pods -n portfolio
kubectl logs deployment/frontend -n portfolio
```

### Reset everything:
```bash
scripts\k8s-stop.bat
scripts\k8s-deploy.bat
```

### Update images:
```bash
kubectl rollout restart deployment -n portfolio
```

## 🏆 Benefits Over Docker Compose

✅ **Auto-healing** - Pods restart if they crash  
✅ **Load balancing** - Traffic distributed across replicas  
✅ **Zero-downtime updates** - Rolling deployments  
✅ **Resource management** - CPU/memory limits  
✅ **Health checks** - Automatic failure detection  
✅ **Scalability** - Easy horizontal scaling  

## 🎉 You're Running Enterprise Kubernetes!

This is the same technology used by:
- Netflix, Spotify, Airbnb
- Google, Microsoft, Amazon
- Every major tech company

**Your portfolio is now production-ready!** 🚀
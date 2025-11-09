# 🚀 Ansible on Windows - Installation Guide

## ❌ Problem: Ansible doesn't work natively on Windows

Ansible requires Unix-like features that Windows doesn't have. You saw this error:
```
AttributeError: module 'os' has no attribute 'get_blocking'
```

## ✅ Solution: 2 Options

### **Option 1: Use WSL (Windows Subsystem for Linux)** ⭐ RECOMMENDED

This gives you full Ansible functionality:

1. **Install WSL (if not already installed):**
   ```powershell
   wsl --install
   ```
   Then restart your computer.

2. **Open Ubuntu (WSL) from Start Menu**

3. **Install Ansible in WSL:**
   ```bash
   sudo apt update
   sudo apt install ansible -y
   ```

4. **Navigate to your project:**
   ```bash
   cd /mnt/c/Users/saisa.DESKTOP-IRA1I5U/Desktop/Portfolio-fullstack
   ```

5. **Run Ansible deployment:**
   ```bash
   cd ansible
   ansible-playbook deploy.yml
   ```

**Advantages:**
- ✅ Full Ansible support
- ✅ Better performance
- ✅ Access to all Ansible features
- ✅ Works exactly as documented

---

### **Option 2: Use PowerShell Script (No Ansible)** ⚡ FASTEST

I just created a PowerShell script that does everything Ansible would do:

**Just run this:**
```powershell
.\deploy-k8s.ps1
```

**That's it!** Access at http://localhost:30080

**Other commands:**
```powershell
# Redeploy without rebuilding
.\deploy-k8s.ps1 -SkipBuild

# Verbose output
.\deploy-k8s.ps1 -Verbose

# Check status
kubectl get all -n portfolio

# View logs
kubectl logs -f deployment/backend -n portfolio

# Delete everything
kubectl delete namespace portfolio
```

**Advantages:**
- ✅ No WSL needed
- ✅ Works right now
- ✅ Native Windows
- ✅ Same result as Ansible

---

## 🎯 My Recommendation

**For you right now:**
1. Use **Option 2** (PowerShell script) to deploy immediately
2. Install **WSL** in the background for future use

**To deploy NOW:**
```powershell
.\deploy-k8s.ps1
```

---

## 📊 Comparison

| Feature | Ansible (WSL) | PowerShell Script |
|---------|--------------|-------------------|
| Setup Time | 10 mins (WSL install) | 0 mins (ready now) |
| Works on Windows | ✅ (via WSL) | ✅ (native) |
| Full Ansible features | ✅ | ❌ |
| Easy to maintain | ✅ | ✅ |
| Production-ready | ✅ | ✅ |

---

## 🆘 Quick Fix for Your Current Issue

**Right now, just run:**
```powershell
.\deploy-k8s.ps1
```

Your application will be deployed in 5-10 minutes! 🚀

---

## 📝 Note

The `ansible/` directory files are still valid and will work perfectly once you have WSL set up. The PowerShell script (`deploy-k8s.ps1`) does the exact same thing but natively on Windows.

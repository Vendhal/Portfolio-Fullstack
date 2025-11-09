#!/bin/bash
# Ansible Deployment via WSL Ubuntu
# This script runs in Ubuntu/WSL and deploys to Kubernetes

echo "=========================================="
echo "  Portfolio Ansible Deployment (WSL)"
echo "=========================================="
echo ""

# Check if Ansible is installed
if ! command -v ansible-playbook &> /dev/null; then
    echo "[INFO] Ansible not found. Installing..."
    sudo apt update
    sudo apt install -y ansible
    echo "[OK] Ansible installed"
else
    echo "[OK] Ansible is already installed"
fi

# Navigate to the project directory
# Convert Windows path to WSL path
WORKSPACE="/mnt/c/Users/saisa.DESKTOP-IRA1I5U/Desktop/Portfolio-fullstack"

if [ ! -d "$WORKSPACE" ]; then
    echo "[ERROR] Workspace not found at $WORKSPACE"
    exit 1
fi

cd "$WORKSPACE/ansible"

echo ""
echo "[INFO] Starting Ansible deployment..."
echo ""

# Run Ansible playbook
ansible-playbook deploy.yml

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  DEPLOYMENT COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Access your application:"
    echo "  Frontend:    http://localhost:30080"
    echo "  Backend API: http://localhost:30080/api/v1"
    echo "  Health:      http://localhost:30080/api/v1/actuator/health"
    echo ""
    echo "Useful commands:"
    echo "  Check status: cd ansible && ansible-playbook status.yml"
    echo "  View logs:    kubectl logs -f deployment/backend -n portfolio"
    echo "  Cleanup:      cd ansible && ansible-playbook cleanup.yml"
    echo ""
else
    echo ""
    echo "[ERROR] Deployment failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check Kubernetes is running in Docker Desktop"
    echo "  - Run: kubectl get pods -n portfolio"
    echo "  - Check logs for details"
    echo ""
fi

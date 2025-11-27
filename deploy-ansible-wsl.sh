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

# Ensure Ansible uses the repo config/inventory and isn't ignored
chmod go-w "$WORKSPACE/ansible" "$WORKSPACE" >/dev/null 2>&1 || true
export ANSIBLE_CONFIG="$WORKSPACE/ansible/ansible.cfg"
INVENTORY="$WORKSPACE/ansible/inventory.yml"
PLAYBOOK="$WORKSPACE/ansible/deploy.yml"

echo ""
echo "[INFO] Starting Ansible deployment..."
echo ""

# Run Ansible playbook
ansible-playbook -i "$INVENTORY" "$PLAYBOOK"

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

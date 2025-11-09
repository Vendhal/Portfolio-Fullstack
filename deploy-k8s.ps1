# Portfolio Kubernetes Deployment Script
# This PowerShell script deploys the Portfolio application to Kubernetes

param(
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Header { param($Message) Write-Host "`n========================================" -ForegroundColor Magenta; Write-Host "  $Message" -ForegroundColor Magenta; Write-Host "========================================`n" -ForegroundColor Magenta }

Write-Header "Portfolio Kubernetes Deployment"

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Docker
try {
    docker info | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Check kubectl
try {
    kubectl version --client --short | Out-Null
    Write-Success "kubectl is available"
} catch {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check Kubernetes cluster
try {
    kubectl cluster-info | Out-Null
    Write-Success "Kubernetes cluster is accessible"
} catch {
    Write-Error "Kubernetes cluster is not running. Enable Kubernetes in Docker Desktop."
    exit 1
}

# Build Docker images (unless skipped)
if (-not $SkipBuild) {
    Write-Header "Building Docker Images"
    
    Write-Info "Building backend image..."
    docker build -t portfolio-backend:latest ./backend
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend build failed"
        exit 1
    }
    Write-Success "Backend image built successfully"
    
    Write-Info "Building frontend image..."
    docker build -t portfolio-frontend:latest ./frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed"
        exit 1
    }
    Write-Success "Frontend image built successfully"
} else {
    Write-Info "Skipping Docker image build (using existing images)"
}

# Deploy to Kubernetes
Write-Header "Deploying to Kubernetes"

# Create namespace
Write-Info "Creating namespace 'portfolio'..."
kubectl apply -f k8s/namespace.yaml
Write-Success "Namespace created"

# Deploy PostgreSQL configuration
Write-Info "Deploying PostgreSQL configuration..."
kubectl apply -f k8s/postgres-config.yaml
kubectl apply -f k8s/init-db-config.yaml
Write-Success "PostgreSQL configuration deployed"

# Deploy PostgreSQL
Write-Info "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres.yaml
Write-Success "PostgreSQL deployed"

# Wait for PostgreSQL to be ready
Write-Info "Waiting for PostgreSQL to be ready..."
$timeout = 120
$elapsed = 0
$interval = 5
while ($elapsed -lt $timeout) {
    $ready = kubectl get pods -n portfolio -l app=postgres -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>$null
    if ($ready -eq "True") {
        Write-Success "PostgreSQL is ready"
        break
    }
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    Write-Host "." -NoNewline
}
Write-Host ""

if ($elapsed -ge $timeout) {
    Write-Warning "PostgreSQL is taking longer than expected to start"
}

# Deploy Backend
Write-Info "Deploying backend..."
kubectl apply -f k8s/backend.yaml
Write-Success "Backend deployed"

# Deploy Frontend
Write-Info "Deploying frontend..."
kubectl apply -f k8s/frontend.yaml
Write-Success "Frontend deployed"

# Deploy Ingress (optional)
if (Test-Path "k8s/ingress.yaml") {
    Write-Info "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml
    Write-Success "Ingress deployed"
}

# Wait for deployments to be ready
Write-Header "Waiting for Deployments to be Ready"

Write-Info "Waiting for backend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n portfolio
Write-Success "Backend is ready"

Write-Info "Waiting for frontend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n portfolio
Write-Success "Frontend is ready"

# Get deployment status
Write-Header "Deployment Status"

Write-Info "Pods:"
kubectl get pods -n portfolio

Write-Info "`nServices:"
kubectl get svc -n portfolio

Write-Info "`nDeployments:"
kubectl get deployments -n portfolio

# Show access information
Write-Header "Deployment Complete!"

Write-Success "Application is now running!"
Write-Host ""
Write-Info "Access your application:"
Write-Host "  Frontend:    http://localhost:30080" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:30080/api/v1" -ForegroundColor Yellow
Write-Host "  Health:      http://localhost:30080/api/v1/actuator/health" -ForegroundColor Yellow
Write-Host ""
Write-Info "Useful commands:"
Write-Host "  View pods:        kubectl get pods -n portfolio"
Write-Host "  View logs:        kubectl logs -f deployment/backend -n portfolio"
Write-Host "  Check status:     kubectl get all -n portfolio"
Write-Host "  Delete all:       kubectl delete namespace portfolio"
Write-Host ""
Write-Info "To redeploy without rebuilding images:"
Write-Host "  .\deploy-k8s.ps1 -SkipBuild"
Write-Host ""

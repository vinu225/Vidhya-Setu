#!/bin/bash
set -e

echo "=============================================================================="
echo " EduVerify AI — Docker Deployment Launcher (SIH Problem Statement 26263)"
echo "=============================================================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    exit 1
fi

echo "Starting Docker containers (Cloud Supabase mode)..."
docker compose up --build -d

echo ""
echo "=============================================================================="
echo " EduVerify AI Successfully Deployed in Docker!"
echo "=============================================================================="
echo " AICTE Central Dashboard:  http://localhost:5173"
echo " FastAPI Swagger Docs:      http://localhost:8000/docs"
echo " Container Health Status:   docker compose ps"
echo ""
echo " To stop containers:        docker compose down"
echo "=============================================================================="

@echo off
echo ==============================================================================
echo  EduVerify AI — Docker Deployment Launcher (SIH Problem Statement 26263)
echo ==============================================================================
echo.
echo Checking Docker service...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed or not in system PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Starting Docker containers (Cloud Supabase mode)...
docker compose up --build -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo  EduVerify AI Successfully Deployed in Docker!
    echo ==============================================================================
    echo  AICTE Central Dashboard:  http://localhost:5173
    echo  FastAPI Swagger Docs:      http://localhost:8000/docs
    echo  Container Health Status:   docker compose ps
    echo.
    echo  To stop containers:        docker compose down
    echo ==============================================================================
) else (
    echo.
    echo [ERROR] Failed to start Docker containers. Ensure Docker Desktop is running.
)
pause

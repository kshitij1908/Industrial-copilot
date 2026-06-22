#!/usr/bin/env pwsh
<#
.SYNOPSIS
    One-click setup script for Industrial Knowledge Copilot
.DESCRIPTION
    Sets up Python virtual environment, installs dependencies,
    and starts the backend development server.
#>

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Industrial Knowledge Copilot - Setup Script  " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonCmd = $null
foreach ($cmd in @('python', 'python3', 'py')) {
    try {
        $version = & $cmd --version 2>&1
        if ($version -match 'Python 3\.1[2-9]') {
            $pythonCmd = $cmd
            Write-Host "[v] Found: $version" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Host "[x] Python 3.12+ not found. Please install from https://python.org/downloads" -ForegroundColor Red
    Write-Host "   After installing, re-run this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup backend
Write-Host ""
Write-Host "[*] Setting up backend..." -ForegroundColor Cyan
$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

# Create venv
if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    & $pythonCmd -m venv .venv
}

# Activate venv
$activateScript = ".venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    . $activateScript
    Write-Host "[v] Virtual environment activated" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing Python dependencies (this may take a few minutes)..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "[v] Dependencies installed" -ForegroundColor Green

# Check .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "[!] IMPORTANT: Edit backend/.env and set your GEMINI_API_KEY!" -ForegroundColor Yellow
    Write-Host "   Get your key at: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    Write-Host ""
}

# Check if API key is set
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'GEMINI_API_KEY=your_gemini_api_key_here') {
    Write-Host ""
    Write-Host "[!] WARNING: GEMINI_API_KEY is not configured!" -ForegroundColor Red
    Write-Host "   Please edit backend/.env and set a real API key before querying documents." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Backend ready! Starting API server...        " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "API:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "Docs:    http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "Health:  http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

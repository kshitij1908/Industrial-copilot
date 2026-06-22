#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup and start the frontend development server
#>

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Industrial Knowledge Copilot - Frontend       " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir

# Check Node
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[v] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[x] Node.js not found!" -ForegroundColor Red
    Write-Host "   Download Node.js 20+ from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "   After installing, re-run this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install deps
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages (this may take a moment)..." -ForegroundColor Yellow
    npm install
    Write-Host "[v] Packages installed" -ForegroundColor Green
} else {
    Write-Host "[v] node_modules found, skipping install" -ForegroundColor Green
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Frontend ready! Starting dev server...       " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "App:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "Login:   admin / admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: Make sure the backend is running at http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev

# ClearFlow Platform Starter Script (PowerShell)
$Host.UI.RawUI.WindowTitle = "ClearFlow - AI-Powered Payment Revenue Recovery Platform"
$env:Path = "C:\Users\HP\nodejs;$env:Path"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "     Starting ClearFlow Full-Stack Platform Server     " -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Base URL:   http://localhost:5000" -ForegroundColor Green
Write-Host "API Health: http://localhost:5000/api/health" -ForegroundColor Green
Write-Host ""

node server/src/server.js

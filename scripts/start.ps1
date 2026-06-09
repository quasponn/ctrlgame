$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

if (-not (Test-Path (Join-Path $Backend "node_modules"))) {
  Write-Host "Сначала выполните: .\scripts\setup.ps1" -ForegroundColor Yellow
  exit 1
}

Write-Host "Сборка frontend..." -ForegroundColor Cyan
Set-Location $Frontend
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Запуск сервера..." -ForegroundColor Cyan
Set-Location $Backend
Write-Host ""
Write-Host "Сайт: http://localhost:3001" -ForegroundColor Green
Write-Host "Логины: admin/admin123, user/user123"
Write-Host "Остановка: Ctrl+C"
npm start

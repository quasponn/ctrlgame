$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "Установка backend..." -ForegroundColor Cyan
Set-Location (Join-Path $Root "backend")
npm install
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Создан backend\.env" -ForegroundColor Green
}
if (-not (Test-Path "db.sqlite")) {
  node seed.js
  Write-Host "База заполнена (seed.js)" -ForegroundColor Green
}

Write-Host "Установка frontend..." -ForegroundColor Cyan
Set-Location (Join-Path $Root "frontend")
npm install

Write-Host ""
Write-Host "Готово. Запуск: .\scripts\start.ps1" -ForegroundColor Green
Write-Host "Или: cd frontend; npm run build; cd ..\backend; npm start"

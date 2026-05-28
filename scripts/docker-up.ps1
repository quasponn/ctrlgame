# Сборка и запуск CtrlGame в Docker с локальной БД backend/db.sqlite
$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker не найден. Установите Docker Desktop: https://www.docker.com/products/docker-desktop/"
}

$info = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Docker Desktop не запущен (демон недоступен)." -ForegroundColor Red
  Write-Host "1. Откройте Docker Desktop из меню Пуск и дождитесь 'Engine running'"
  Write-Host "2. Включите WSL 2: wsl --update"
  Write-Host "3. Перезагрузите ПК"
  Write-Host ""
  Write-Host "Без Docker:" -ForegroundColor Yellow
  Write-Host "  cd backend; npm start"
  Write-Host "  cd frontend; npm run dev"
  exit 1
}

Set-Location $PSScriptRoot\..

$dbPath = Join-Path (Get-Location) "backend\db.sqlite"
if (-not (Test-Path $dbPath -PathType Leaf)) {
  Write-Host ""
  Write-Host "Не найден файл backend\db.sqlite" -ForegroundColor Red
  Write-Host "Сначала заполните БД локально: cd backend; node seed.js"
  exit 1
}

Write-Host "Используется ваша БД: $dbPath" -ForegroundColor Cyan
Write-Host "Остановите локальный backend (npm start), если он запущен — иначе SQLite будет занят." -ForegroundColor Yellow
Write-Host ""

Write-Host "Сборка образа..." -ForegroundColor Cyan
docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Запуск контейнера..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 5
Write-Host ""
Write-Host "Готово: http://localhost:3001" -ForegroundColor Green
Write-Host "Ваши аккаунты и игры — из backend\db.sqlite"
Write-Host "Логи: docker compose logs -f app"
Write-Host "Стоп: docker compose down"

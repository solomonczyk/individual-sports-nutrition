# Скрипт быстрого запуска мобильной версии для тестирования
# Использование: .\scripts\test-mobile.ps1 [android|ios]

param(
    [Parameter(Position=0)]
    [ValidateSet("android", "ios", "")]
    [string]$Platform = ""
)

Write-Host "🚀 Запуск мобильной версии для тестирования..." -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js не найден. Установи Node.js v18+ и повтори попытку." -ForegroundColor Red
    exit 1
}

# Проверка наличия npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm не найден. Установи npm и повтори попытку." -ForegroundColor Red
    exit 1
}

# Переход в директорию мобильного приложения
$mobileAppPath = Join-Path $PSScriptRoot ".." "mobile-app"
if (-not (Test-Path $mobileAppPath)) {
    Write-Host "❌ Директория mobile-app не найдена: $mobileAppPath" -ForegroundColor Red
    exit 1
}

Set-Location $mobileAppPath
Write-Host "📁 Рабочая директория: $mobileAppPath" -ForegroundColor Gray

# Проверка наличия node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка установки зависимостей" -ForegroundColor Red
        exit 1
    }
}

# Выбор платформы
$command = "npm start"
if ($Platform -eq "android") {
    Write-Host "🤖 Запуск для Android..." -ForegroundColor Green
    $command = "npm run android"
} elseif ($Platform -eq "ios") {
    Write-Host "🍎 Запуск для iOS..." -ForegroundColor Green
    $command = "npm run ios"
} else {
    Write-Host "📱 Запуск Expo (выбери платформу в меню)..." -ForegroundColor Green
    Write-Host "   Нажми 'a' для Android" -ForegroundColor Gray
    Write-Host "   Нажми 'i' для iOS" -ForegroundColor Gray
    Write-Host "   Нажми 'w' для веб-версии" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✅ Запускаю Expo..." -ForegroundColor Green
Write-Host ""

# Запуск Expo
Invoke-Expression $command


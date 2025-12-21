# Скрипт быстрого запуска веб-версии для тестирования
# Использование: .\scripts\test-web.ps1

Write-Host "🌐 Запуск веб-версии для тестирования..." -ForegroundColor Cyan
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

# Проверка и установка веб-зависимостей для Expo
Write-Host "🌐 Проверка веб-зависимостей..." -ForegroundColor Yellow
$hasWebDeps = Test-Path "node_modules\react-native-web" -and Test-Path "node_modules\react-dom"
if (-not $hasWebDeps) {
    Write-Host "📦 Установка веб-зависимостей (react-native-web, react-dom)..." -ForegroundColor Yellow
    npx expo install react-native-web react-dom
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка установки веб-зависимостей" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🌐 Запуск веб-версии Expo..." -ForegroundColor Green
Write-Host "   Приложение будет доступно на http://localhost:8081" -ForegroundColor Gray
Write-Host "   (или другой порт, если 8081 занят)" -ForegroundColor Gray
Write-Host ""

# Запуск веб-версии через npx (на случай, если expo не установлен глобально)
if (Test-Path "node_modules\.bin\expo.cmd") {
    Write-Host "✅ Используется локальный Expo CLI" -ForegroundColor Green
    npm run web
} else {
    Write-Host "✅ Используется npx expo" -ForegroundColor Green
    npx expo start --web
}


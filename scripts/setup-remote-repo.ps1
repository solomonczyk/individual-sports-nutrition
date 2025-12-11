# PowerShell скрипт для настройки удаленного репозитория
# Использование: .\scripts\setup-remote-repo.ps1 <repo-url>

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "Настройка удаленного репозитория: $RepoUrl" -ForegroundColor Cyan
Write-Host ""

# Проверка существования remote
$existingRemote = git remote | Select-String -Pattern "^origin$"
if ($existingRemote) {
    $response = Read-Host "Remote 'origin' уже существует. Заменить? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git remote remove origin
    } else {
        Write-Host "Отменено." -ForegroundColor Yellow
        exit 0
    }
}

# Добавление remote
git remote add origin $RepoUrl

# Проверка подключения
Write-Host "Проверка подключения к удаленному репозиторию..."
$check = git ls-remote --heads origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Успешное подключение к репозиторию" -ForegroundColor Green
} else {
    Write-Host "✗ Ошибка: не удалось подключиться к репозиторию" -ForegroundColor Red
    Write-Host "Проверьте URL и права доступа"
    exit 1
}

# Пуш в удаленный репозиторий
Write-Host ""
Write-Host "Отправка кода в удаленный репозиторий..."
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Код успешно отправлен в удаленный репозиторий" -ForegroundColor Green
    Write-Host ""
    Write-Host "Для проверки:" -ForegroundColor Cyan
    Write-Host "  git remote -v"
    Write-Host "  git branch -a"
} else {
    Write-Host ""
    Write-Host "✗ Ошибка при отправке кода" -ForegroundColor Red
    Write-Host "Возможные причины:"
    Write-Host "  - Репозиторий не пустой (используйте --force, если уверены)"
    Write-Host "  - Нет прав на запись"
    Write-Host "  - Проблемы с сетью"
    exit 1
}


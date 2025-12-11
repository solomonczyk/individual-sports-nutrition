# Скрипт для автоматической настройки SSH доступа без пароля
# Использование: .\scripts\setup-ssh-access.ps1

param(
    [string]$ServerIP = "152.53.227.37",
    [string]$ServerUser = "root",
    [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519.pub"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Настройка SSH доступа без пароля" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия SSH ключа
if (-not (Test-Path $KeyPath)) {
    Write-Host "✗ SSH ключ не найден: $KeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Создать новый SSH ключ? (y/n)" -ForegroundColor Yellow
    $createKey = Read-Host
    if ($createKey -eq "y" -or $createKey -eq "Y") {
        Write-Host "Создание SSH ключа..."
        ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_ed25519" -N '""'
        Write-Host "✓ SSH ключ создан" -ForegroundColor Green
    } else {
        Write-Host "Отменено." -ForegroundColor Yellow
        exit 1
    }
}

# Чтение публичного ключа
Write-Host "Чтение публичного ключа..."
$pubKey = Get-Content $KeyPath -Raw
$pubKey = $pubKey.Trim()

Write-Host "✓ Публичный ключ:" -ForegroundColor Green
Write-Host $pubKey -ForegroundColor Gray
Write-Host ""

# Попытка копирования ключа
Write-Host "Попытка автоматического копирования ключа на сервер..." -ForegroundColor Yellow
Write-Host "Введите пароль для подключения к серверу (один раз):" -ForegroundColor Yellow
Write-Host ""

try {
    $command = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'"
    
    $result = ssh "$ServerUser@$ServerIP" $command 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ SSH ключ успешно установлен на сервере!" -ForegroundColor Green
        Write-Host ""
        
        # Проверка подключения
        Write-Host "Проверка подключения без пароля..." -ForegroundColor Cyan
        $testConnection = ssh -o BatchMode=yes -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo 'Connection successful'" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Подключение без пароля работает!" -ForegroundColor Green
        } else {
            Write-Host "⚠ Подключение без пароля может не работать сразу" -ForegroundColor Yellow
            Write-Host "Попробуйте подключиться вручную: ssh $ServerUser@$ServerIP" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "✗ Ошибка при установке ключа" -ForegroundColor Red
        Write-Host "Попробуйте вручную:" -ForegroundColor Yellow
        Write-Host "1. Скопируйте ваш публичный ключ (показан выше)" -ForegroundColor Yellow
        Write-Host "2. Подключитесь: ssh $ServerUser@$ServerIP" -ForegroundColor Yellow
        Write-Host "3. Выполните:" -ForegroundColor Yellow
        Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
        Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
        Write-Host "   nano ~/.ssh/authorized_keys" -ForegroundColor Gray
        Write-Host "   (вставьте ключ и сохраните)" -ForegroundColor Gray
        Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    }
} catch {
    Write-Host ""
    Write-Host "✗ Ошибка: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ручная установка:" -ForegroundColor Yellow
    Write-Host "1. Ваш публичный ключ:" -ForegroundColor Yellow
    Write-Host $pubKey -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Подключитесь к серверу и выполните:" -ForegroundColor Yellow
    Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
    Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
    Write-Host "   echo '$pubKey' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Настройка SSH config для удобства..." -ForegroundColor Cyan
$sshConfigPath = "$env:USERPROFILE\.ssh\config"
$configEntry = @"

Host isn-server
    HostName $ServerIP
    User $ServerUser
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
"@

if (Test-Path $sshConfigPath) {
    $existingConfig = Get-Content $sshConfigPath -Raw
    if ($existingConfig -notmatch "Host isn-server") {
        Add-Content -Path $sshConfigPath -Value $configEntry
        Write-Host "✓ SSH config обновлен" -ForegroundColor Green
    } else {
        Write-Host "✓ SSH config уже содержит запись isn-server" -ForegroundColor Green
    }
} else {
    New-Item -Path $sshConfigPath -ItemType File -Force | Out-Null
    Set-Content -Path $sshConfigPath -Value $configEntry
    Write-Host "✓ SSH config создан" -ForegroundColor Green
}

Write-Host ""
Write-Host "Теперь вы можете подключаться просто:" -ForegroundColor Cyan
Write-Host "  ssh isn-server" -ForegroundColor Green
Write-Host ""
Write-Host "Или:" -ForegroundColor Cyan
Write-Host "  ssh $ServerUser@$ServerIP" -ForegroundColor Green


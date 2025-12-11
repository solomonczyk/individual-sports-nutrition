# Быстрый старт - Деплой на сервер

## Шаг 1: Создание удаленного репозитория

### Вариант A: GitHub

1. Зайдите на [GitHub](https://github.com) и создайте новый репозиторий:
   - Название: `individual-sports-nutrition`
   - Описание: "Individual Sports Nutrition - Personalized Sports Nutrition App"
   - Публичный или приватный (на ваш выбор)
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)

2. Скопируйте URL репозитория (HTTPS или SSH)

### Вариант B: GitLab

1. Зайдите на [GitLab](https://gitlab.com) и создайте новый проект
2. Скопируйте URL репозитория

### Вариант C: Bitbucket

1. Зайдите на [Bitbucket](https://bitbucket.org) и создайте новый репозиторий
2. Скопируйте URL репозитория

## Шаг 2: Настройка удаленного репозитория

### Windows (PowerShell)

```powershell
.\scripts\setup-remote-repo.ps1 <your-repo-url>
```

Пример:
```powershell
.\scripts\setup-remote-repo.ps1 https://github.com/username/individual-sports-nutrition.git
```

### Linux/Mac (Bash)

```bash
chmod +x scripts/setup-remote-repo.sh
./scripts/setup-remote-repo.sh <your-repo-url>
```

Пример:
```bash
./scripts/setup-remote-repo.sh https://github.com/username/individual-sports-nutrition.git
```

### Вручную

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## Шаг 3: Подключение к серверу

### Настройка SSH ключей (если еще не настроено)

На вашей локальной машине:

```bash
# Генерация SSH ключа (если еще нет)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Копирование ключа на сервер
ssh-copy-id root@152.53.227.37
```

Windows (PowerShell):
```powershell
# Если используете OpenSSH
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@152.53.227.37 "cat >> .ssh/authorized_keys"
```

### Проверка подключения

```bash
ssh root@152.53.227.37
```

## Шаг 4: Первый деплой на сервер

### Автоматический (скрипт)

Linux/Mac:
```bash
chmod +x scripts/deploy-to-server.sh
./scripts/deploy-to-server.sh
```

### Ручной (рекомендуется для первого раза)

1. **Подключитесь к серверу:**
   ```bash
   ssh root@152.53.227.37
   ```

2. **Следуйте инструкциям из `docs/deployment/server-setup.md`**

   Краткая версия:
   ```bash
   # Обновление системы
   apt update && apt upgrade -y
   
   # Установка зависимостей
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs python3.11 python3.11-venv python3-pip postgresql postgresql-contrib redis-server nginx git
   
   # Создание пользователя
   adduser isnapp
   usermod -aG sudo isnapp
   
   # Переключение на пользователя
   su - isnapp
   
   # Клонирование репозитория
   git clone <your-repo-url> individual-sports-nutrition
   cd individual-sports-nutrition
   ```

3. **Настройка приложения:**
   - Создайте `.env` файлы для backend-api и ai-service
   - Настройте PostgreSQL и Redis
   - Установите зависимости
   - Настройте systemd сервисы (см. `server-setup.md`)

## Шаг 5: Последующие обновления

После первого деплоя, для обновления приложения:

```bash
ssh root@152.53.227.37
cd /home/isnapp/individual-sports-nutrition
git pull origin main

# Backend
cd backend-api
npm install
npm run build
sudo systemctl restart isn-backend

# AI Service
cd ../ai-service
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart isn-ai
```

Или используйте скрипт:
```bash
./scripts/deploy-to-server.sh
# Выберите вариант 2 (Обновление)
```

## Проверка работоспособности

```bash
# Статус сервисов
sudo systemctl status isn-backend
sudo systemctl status isn-ai

# Логи
sudo journalctl -u isn-backend -f
sudo journalctl -u isn-ai -f

# Проверка API
curl http://localhost:3000/api/v1/health
curl http://localhost:8000/health
```

## Полезные команды

```bash
# Проверка портов
netstat -tulpn | grep -E ':(3000|8000)'

# Перезапуск всех сервисов
sudo systemctl restart isn-backend isn-ai nginx

# Проверка Nginx
sudo nginx -t
sudo systemctl status nginx
```


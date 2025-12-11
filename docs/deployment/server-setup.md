# Инструкция по настройке сервера

## Информация о сервере

- **IP**: 152.53.227.37
- **Архитектура**: ARM64
- **RAM**: 8 GB
- **CPU**: 6 ядер
- **Disk**: 256 GB
- **OS**: Ubuntu (предположительно)

## Первоначальная настройка

### 1. Подключение к серверу

```bash
ssh root@152.53.227.37
```

### 2. Обновление системы

```bash
apt update && apt upgrade -y
```

### 3. Установка необходимого ПО

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Python 3.11+
apt install -y python3.11 python3.11-venv python3-pip

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Redis
apt install -y redis-server

# Nginx
apt install -y nginx

# Git
apt install -y git

# Docker (опционально, для контейнеризации)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 4. Настройка PostgreSQL

```bash
sudo -u postgres psql

# В psql консоли:
CREATE DATABASE individual_sports_nutrition;
CREATE USER isn_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE individual_sports_nutrition TO isn_user;
\q
```

### 5. Настройка Redis

```bash
systemctl enable redis-server
systemctl start redis-server
```

### 6. Настройка Nginx

Создайте конфигурацию `/etc/nginx/sites-available/individual-sports-nutrition`:

```nginx
server {
    listen 80;
    server_name 152.53.227.37;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ai/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
ln -s /etc/nginx/sites-available/individual-sports-nutrition /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 7. Создание пользователя для приложения

```bash
adduser isnapp
usermod -aG sudo isnapp
su - isnapp
```

### 8. Клонирование репозитория

```bash
cd /home/isnapp
git clone <repository_url> individual-sports-nutrition
cd individual-sports-nutrition
```

## Установка приложения

### Backend API

```bash
cd backend-api
npm install
cp .env.example .env
# Отредактируйте .env с правильными данными БД и сервисов
npm run build
```

### AI Service

```bash
cd ai-service
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Отредактируйте .env
```

## Настройка systemd сервисов

### Backend API Service

Создайте `/etc/systemd/system/isn-backend.service`:

```ini
[Unit]
Description=Individual Sports Nutrition Backend API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=isnapp
WorkingDirectory=/home/isnapp/individual-sports-nutrition/backend-api
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### AI Service

Создайте `/etc/systemd/system/isn-ai.service`:

```ini
[Unit]
Description=Individual Sports Nutrition AI Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=isnapp
WorkingDirectory=/home/isnapp/individual-sports-nutrition/ai-service
Environment="PATH=/home/isnapp/individual-sports-nutrition/ai-service/venv/bin"
ExecStart=/home/isnapp/individual-sports-nutrition/ai-service/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запуск сервисов:

```bash
systemctl daemon-reload
systemctl enable isn-backend isn-ai
systemctl start isn-backend isn-ai
systemctl status isn-backend isn-ai
```

## Мониторинг

```bash
# Логи Backend
journalctl -u isn-backend -f

# Логи AI Service
journalctl -u isn-ai -f

# Статус сервисов
systemctl status isn-backend isn-ai
```

## Обновление приложения

```bash
cd /home/isnapp/individual-sports-nutrition
git pull origin main

# Backend
cd backend-api
npm install
npm run build
systemctl restart isn-backend

# AI Service
cd ../ai-service
source venv/bin/activate
pip install -r requirements.txt
systemctl restart isn-ai
```


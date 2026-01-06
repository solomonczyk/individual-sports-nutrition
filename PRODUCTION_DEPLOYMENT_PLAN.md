# 🚀 Production Deployment Plan

**Дата:** 6 января 2026  
**Проект:** Individual Sports Nutrition Platform  
**Статус готовности:** 95% ✅  

---

## 📋 Обзор деплоя

### Что деплоим:
- ✅ **Backend API** (Node.js + Express + TypeScript) - готов к production
- ✅ **Admin Panel** (Next.js 14) - готов к production  
- ✅ **Database** (PostgreSQL) - миграции готовы
- ✅ **Security & Performance** - все критические улучшения реализованы

### Архитектура деплоя:
```
Internet → Nginx (SSL) → Backend API (3003) + Admin Panel (3001) → PostgreSQL + Redis
```

---

## 🎯 План деплоя по шагам

### Шаг 1: Подготовка сервера (30 минут)

#### 1.1 Подключение к серверу
```bash
# Подключение к серверу
ssh root@152.53.227.37

# Обновление системы
apt update && apt upgrade -y
```

#### 1.2 Установка зависимостей
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PostgreSQL 15
apt-get install -y postgresql postgresql-contrib

# Redis
apt-get install -y redis-server

# Nginx
apt-get install -y nginx

# PM2 для управления процессами
npm install -g pm2

# Git
apt-get install -y git

# Проверка версий
node --version  # v20.x
npm --version   # 10.x
psql --version  # 15.x
redis-server --version  # 7.x
nginx -v        # 1.x
```

### Шаг 2: Настройка базы данных (20 минут)

#### 2.1 Создание базы данных
```bash
# Переключение на пользователя postgres
sudo -u postgres psql

-- Создание базы данных и пользователя
CREATE DATABASE individual_sports_nutrition;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'secure_password_2026!';
GRANT ALL PRIVILEGES ON DATABASE individual_sports_nutrition TO app_user;
\q
```

#### 2.2 Настройка PostgreSQL
```bash
# Редактирование конфигурации
nano /etc/postgresql/15/main/postgresql.conf

# Добавить/изменить:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB

# Настройка аутентификации
nano /etc/postgresql/15/main/pg_hba.conf

# Добавить:
local   individual_sports_nutrition    app_user                md5

# Перезапуск PostgreSQL
systemctl restart postgresql
systemctl enable postgresql
```

### Шаг 3: Настройка Redis (10 минут)

```bash
# Настройка Redis
nano /etc/redis/redis.conf

# Изменить:
bind 127.0.0.1
maxmemory 256mb
maxmemory-policy allkeys-lru

# Перезапуск Redis
systemctl restart redis-server
systemctl enable redis-server

# Проверка
redis-cli ping  # Должен вернуть PONG
```

### Шаг 4: Клонирование и настройка проекта (20 минут)

#### 4.1 Клонирование репозитория
```bash
# Создание пользователя для приложения
adduser --disabled-password --gecos "" isnapp
usermod -aG sudo isnapp

# Переключение на пользователя приложения
su - isnapp

# Клонирование проекта
git clone https://github.com/solomonczyk/individual-sports-nutrition.git
cd individual-sports-nutrition
```

#### 4.2 Настройка Backend API
```bash
cd backend-api

# Установка зависимостей
npm install

# Создание production .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3003
API_VERSION=v1

# Database
DATABASE_URL=postgresql://app_user:secure_password_2026!@localhost:5432/individual_sports_nutrition
DB_POOL_SIZE=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=super_secure_jwt_secret_32_characters_long_2026
CORS_ORIGIN=http://your-domain.com,https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
EOF

# Сборка проекта
npm run build

# Проверка сборки
ls -la dist/
```

#### 4.3 Настройка Admin Panel
```bash
cd ../admin-panel

# Установка зависимостей
npm install

# Создание production .env
cat > .env.local << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
EOF

# Сборка проекта
npm run build

# Проверка сборки
ls -la .next/
```

### Шаг 5: Выполнение миграций базы данных (15 минут)

```bash
cd ../database

# Выполнение миграций по порядку
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/001_initial_schema.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/002_stores_and_prices.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/003_ingredients_and_meals.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/004_serbian_localization.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/005_user_food_preferences.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/006_meal_plans.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/007_aggregation_tables.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/008_audit_log.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/009_serbian_cuisine.sql
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f migrations/010_refresh_tokens.sql

# Проверка таблиц
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -c "\dt"

# Загрузка начальных данных (если есть)
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -f seed-data.sql
```

### Шаг 6: Настройка PM2 для управления процессами (15 минут)

#### 6.1 Создание PM2 конфигурации
```bash
cd /home/isnapp/individual-sports-nutrition

# Создание ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'backend-api',
      cwd: './backend-api',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: '/var/log/isn/backend-api-error.log',
      out_file: '/var/log/isn/backend-api-out.log',
      log_file: '/var/log/isn/backend-api-combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512'
    },
    {
      name: 'admin-panel',
      cwd: './admin-panel',
      script: 'npm',
      args: 'start',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/isn/admin-panel-error.log',
      out_file: '/var/log/isn/admin-panel-out.log',
      log_file: '/var/log/isn/admin-panel-combined.log',
      time: true,
      max_memory_restart: '300M'
    }
  ]
};
EOF

# Создание директории для логов
sudo mkdir -p /var/log/isn
sudo chown isnapp:isnapp /var/log/isn
```

#### 6.2 Запуск приложений через PM2
```bash
# Запуск приложений
pm2 start ecosystem.config.js

# Проверка статуса
pm2 status

# Просмотр логов
pm2 logs

# Сохранение конфигурации PM2
pm2 save
pm2 startup
# Выполнить команду, которую выдаст pm2 startup
```

### Шаг 7: Настройка Nginx (20 минут)

#### 7.1 Создание конфигурации Nginx
```bash
sudo nano /etc/nginx/sites-available/individual-sports-nutrition

# Добавить конфигурацию:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (если есть SSL)
    # return 301 https://$server_name$request_uri;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health checks
    location /health {
        proxy_pass http://localhost:3003/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Admin Panel
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

#### 7.2 Активация конфигурации
```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/individual-sports-nutrition /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Шаг 8: Настройка SSL (опционально, 15 минут)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Шаг 9: Настройка мониторинга (15 минут)

#### 9.1 Настройка логирования
```bash
# Настройка ротации логов
sudo nano /etc/logrotate.d/isn

# Добавить:
/var/log/isn/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 isnapp isnapp
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 9.2 Настройка мониторинга PM2
```bash
# Установка PM2 monitoring
pm2 install pm2-server-monit

# Настройка уведомлений (опционально)
pm2 set pm2-server-monit:conf '{"port": 8080}'
```

### Шаг 10: Проверка деплоя (20 минут)

#### 10.1 Проверка сервисов
```bash
# Проверка статуса всех сервисов
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx
pm2 status

# Проверка портов
netstat -tlnp | grep -E ':(3001|3003|5432|6379|80)'
```

#### 10.2 Тестирование API
```bash
# Health check
curl http://localhost/health
curl http://localhost/api/v1/health

# API endpoints
curl http://localhost/api/v1/ready
curl http://localhost/api/v1/live

# Admin panel
curl -I http://localhost/
```

#### 10.3 Проверка логов
```bash
# PM2 логи
pm2 logs --lines 50

# Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Системные логи
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

---

## 🔧 Команды для управления

### Управление приложением
```bash
# Перезапуск всех сервисов
pm2 restart all

# Перезапуск конкретного сервиса
pm2 restart backend-api
pm2 restart admin-panel

# Просмотр логов
pm2 logs backend-api
pm2 logs admin-panel

# Мониторинг
pm2 monit
```

### Обновление приложения
```bash
# Получение обновлений
cd /home/isnapp/individual-sports-nutrition
git pull origin main

# Обновление Backend API
cd backend-api
npm install
npm run build
pm2 restart backend-api

# Обновление Admin Panel
cd ../admin-panel
npm install
npm run build
pm2 restart admin-panel
```

### Резервное копирование
```bash
# Создание бэкапа базы данных
PGPASSWORD=secure_password_2026! pg_dump -h localhost -U app_user individual_sports_nutrition > backup_$(date +%Y%m%d_%H%M%S).sql

# Автоматический бэкап (добавить в crontab)
0 2 * * * PGPASSWORD=secure_password_2026! pg_dump -h localhost -U app_user individual_sports_nutrition | gzip > /backups/db_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

---

## 🚨 Troubleshooting

### Проблема: Backend API не запускается
```bash
# Проверка логов
pm2 logs backend-api

# Проверка переменных окружения
cat backend-api/.env

# Проверка подключения к БД
PGPASSWORD=secure_password_2026! psql -h localhost -U app_user -d individual_sports_nutrition -c "SELECT 1"

# Проверка порта
netstat -tlnp | grep 3003
```

### Проблема: Admin Panel не доступен
```bash
# Проверка логов
pm2 logs admin-panel

# Проверка сборки
ls -la admin-panel/.next/

# Проверка порта
netstat -tlnp | grep 3001
```

### Проблема: Nginx ошибки
```bash
# Проверка конфигурации
sudo nginx -t

# Проверка логов
sudo tail -f /var/log/nginx/error.log

# Перезапуск
sudo systemctl restart nginx
```

---

## 📊 Финальная проверка

После деплоя проверьте:

- [ ] ✅ Backend API доступен: `curl http://your-domain.com/api/v1/health`
- [ ] ✅ Admin Panel доступен: `curl -I http://your-domain.com/`
- [ ] ✅ База данных работает: проверка через API
- [ ] ✅ Redis работает: проверка кэширования
- [ ] ✅ Логи пишутся: `pm2 logs`
- [ ] ✅ SSL работает (если настроен): `curl -I https://your-domain.com/`
- [ ] ✅ Мониторинг работает: `pm2 monit`

---

## 🎉 Готово!

**Ваше приложение Individual Sports Nutrition успешно развернуто!**

**Доступ:**
- 🌐 **Admin Panel:** http://your-domain.com/
- 🔧 **API:** http://your-domain.com/api/v1/
- 🏥 **Health Check:** http://your-domain.com/health

**Управление:**
- `pm2 status` - статус приложений
- `pm2 logs` - просмотр логов
- `pm2 restart all` - перезапуск всех сервисов

**Мониторинг:**
- `pm2 monit` - мониторинг ресурсов
- `/var/log/isn/` - логи приложений
- `/var/log/nginx/` - логи веб-сервера

---

**Статус:** ✅ ГОТОВО К PRODUCTION  
**Время деплоя:** ~3 часа  
**Готовность:** 95% → 100% ✅
# 🚀 Инструкции по деплою Individual Sports Nutrition

**Статус:** ✅ Готово к production  
**Время деплоя:** 15-30 минут  
**Сложность:** Простая (Docker)

---

## 📋 Что будет развернуто

- ✅ **Backend API** (Node.js + TypeScript) на порту 3003
- ✅ **Admin Panel** (Next.js 14) на порту 3001  
- ✅ **PostgreSQL 15** база данных
- ✅ **Redis 7** для кэширования
- ✅ **Nginx** reverse proxy на порту 80
- ✅ **Все критические улучшения безопасности**

---

## 🔧 Требования к серверу

### Минимальные требования:
- **OS:** Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM:** 4GB (рекомендуется 8GB)
- **CPU:** 2 cores (рекомендуется 4 cores)
- **Диск:** 20GB свободного места
- **Docker:** 20.10+
- **Docker Compose:** 2.0+

### Проверка требований:
```bash
# Проверка системы
free -h          # RAM
nproc            # CPU cores
df -h            # Диск
docker --version # Docker
docker-compose --version # Docker Compose
```

---

## 🚀 Быстрый деплой (рекомендуется)

### Шаг 1: Клонирование проекта
```bash
# Клонирование репозитория
git clone https://github.com/solomonczyk/individual-sports-nutrition.git
cd individual-sports-nutrition
```

### Шаг 2: Настройка окружения
```bash
# Создание production конфигурации
cp .env.production.example .env.production

# Редактирование конфигурации (ВАЖНО!)
nano .env.production
```

**Обязательно измените:**
```bash
# Сильный пароль для базы данных
DB_PASSWORD=your_secure_database_password_2026!

# Уникальный JWT секрет (32+ символов)
JWT_SECRET=your_unique_jwt_secret_32_characters_long_2026

# Ваш домен
CORS_ORIGIN=http://your-domain.com,https://your-domain.com
```

### Шаг 3: Запуск деплоя
```bash
# Запуск автоматического деплоя
./deploy.sh
```

**Скрипт автоматически:**
- ✅ Проверит зависимости
- ✅ Создаст необходимые директории
- ✅ Соберет Docker образы
- ✅ Запустит все сервисы
- ✅ Дождется готовности всех компонентов
- ✅ Проверит здоровье сервисов

### Шаг 4: Проверка результата
После успешного деплоя:
```bash
# Проверка статуса
docker-compose -f docker-compose.production.yml ps

# Проверка здоровья
curl http://localhost/health
curl http://localhost/api/v1/health
```

**Доступ к приложению:**
- 🌐 **Admin Panel:** http://your-server-ip/
- 🔧 **API:** http://your-server-ip/api/v1/
- 🏥 **Health Check:** http://your-server-ip/health

---

## 🔧 Ручной деплой (альтернатива)

Если автоматический скрипт не работает:

### 1. Подготовка
```bash
# Создание директорий
mkdir -p logs/nginx nginx/ssl

# Настройка .env.production (см. выше)
```

### 2. Сборка и запуск
```bash
# Остановка существующих контейнеров
docker-compose -f docker-compose.production.yml down

# Сборка образов
docker-compose -f docker-compose.production.yml build

# Запуск сервисов
docker-compose -f docker-compose.production.yml up -d
```

### 3. Проверка
```bash
# Ожидание готовности (2-3 минуты)
sleep 180

# Проверка сервисов
curl http://localhost/health
```

---

## 📊 Управление приложением

### Просмотр статуса
```bash
# Статус всех контейнеров
docker-compose -f docker-compose.production.yml ps

# Использование ресурсов
docker stats
```

### Просмотр логов
```bash
# Все логи
docker-compose -f docker-compose.production.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.production.yml logs -f backend-api
docker-compose -f docker-compose.production.yml logs -f admin-panel
docker-compose -f docker-compose.production.yml logs -f nginx
```

### Перезапуск сервисов
```bash
# Перезапуск всех сервисов
docker-compose -f docker-compose.production.yml restart

# Перезапуск конкретного сервиса
docker-compose -f docker-compose.production.yml restart backend-api
docker-compose -f docker-compose.production.yml restart admin-panel
```

### Остановка приложения
```bash
# Остановка всех сервисов
docker-compose -f docker-compose.production.yml down

# Остановка с удалением данных (ОСТОРОЖНО!)
docker-compose -f docker-compose.production.yml down -v
```

---

## 🔄 Обновление приложения

### Обновление кода
```bash
# Получение последних изменений
git pull origin main

# Пересборка и перезапуск
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Обновление только Backend API
```bash
# Пересборка только backend
docker-compose -f docker-compose.production.yml build --no-cache backend-api
docker-compose -f docker-compose.production.yml up -d backend-api
```

---

## 💾 Резервное копирование

### Создание бэкапа базы данных
```bash
# Создание бэкапа
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U app_user individual_sports_nutrition > backup_$(date +%Y%m%d_%H%M%S).sql

# Сжатие бэкапа
gzip backup_*.sql
```

### Восстановление из бэкапа
```bash
# Восстановление базы данных
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose -f docker-compose.production.yml exec -T postgres psql -U app_user individual_sports_nutrition
```

### Автоматический бэкап (crontab)
```bash
# Добавление в crontab
crontab -e

# Добавить строку (бэкап каждый день в 2:00)
0 2 * * * cd /path/to/project && docker-compose -f docker-compose.production.yml exec postgres pg_dump -U app_user individual_sports_nutrition | gzip > /backups/db_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

---

## 🔒 Настройка SSL (HTTPS)

### Получение SSL сертификата (Let's Encrypt)
```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem
```

### Активация HTTPS в Nginx
```bash
# Редактирование nginx.conf
nano nginx/nginx.conf

# Раскомментировать HTTPS server блок
# Изменить server_name на ваш домен

# Перезапуск Nginx
docker-compose -f docker-compose.production.yml restart nginx
```

---

## 🚨 Troubleshooting

### Проблема: Контейнеры не запускаются
```bash
# Проверка логов
docker-compose -f docker-compose.production.yml logs

# Проверка портов
netstat -tlnp | grep -E ':(80|3001|3003|5432|6379)'

# Освобождение портов (если заняты)
sudo fuser -k 80/tcp
sudo fuser -k 3001/tcp
sudo fuser -k 3003/tcp
```

### Проблема: База данных недоступна
```bash
# Проверка PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U app_user

# Проверка логов PostgreSQL
docker-compose -f docker-compose.production.yml logs postgres

# Пересоздание базы данных
docker-compose -f docker-compose.production.yml down
docker volume rm individual-sports-nutrition_postgres_data
docker-compose -f docker-compose.production.yml up -d
```

### Проблема: API возвращает 500 ошибки
```bash
# Проверка логов Backend API
docker-compose -f docker-compose.production.yml logs backend-api

# Проверка переменных окружения
docker-compose -f docker-compose.production.yml exec backend-api env | grep -E '(DATABASE_URL|JWT_SECRET)'

# Перезапуск Backend API
docker-compose -f docker-compose.production.yml restart backend-api
```

### Проблема: Admin Panel не загружается
```bash
# Проверка логов Admin Panel
docker-compose -f docker-compose.production.yml logs admin-panel

# Проверка сборки
docker-compose -f docker-compose.production.yml build --no-cache admin-panel
docker-compose -f docker-compose.production.yml up -d admin-panel
```

---

## 📈 Мониторинг

### Проверка производительности
```bash
# Использование ресурсов
docker stats

# Проверка времени отклика
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/v1/health

# Создание curl-format.txt
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

### Health Checks
```bash
# Проверка всех endpoints
curl http://localhost/health          # Nginx + Backend
curl http://localhost/api/v1/health   # Backend API
curl http://localhost/api/v1/ready    # Readiness probe
curl http://localhost/api/v1/live     # Liveness probe
```

---

## ✅ Финальная проверка

После деплоя убедитесь, что:

- [ ] ✅ Admin Panel доступен: http://your-server-ip/
- [ ] ✅ API отвечает: http://your-server-ip/api/v1/health
- [ ] ✅ База данных работает: проверка через API
- [ ] ✅ Redis работает: проверка кэширования
- [ ] ✅ Логи пишутся: `docker-compose logs`
- [ ] ✅ Все контейнеры запущены: `docker-compose ps`
- [ ] ✅ Health checks проходят: все endpoints возвращают 200

---

## 🎉 Готово!

**Ваше приложение Individual Sports Nutrition успешно развернуто!**

**🌐 Доступ:**
- **Admin Panel:** http://your-server-ip/
- **API Documentation:** http://your-server-ip/api/v1/
- **Health Check:** http://your-server-ip/health

**📊 Мониторинг:**
- `docker-compose -f docker-compose.production.yml ps` - статус
- `docker-compose -f docker-compose.production.yml logs -f` - логи
- `docker stats` - использование ресурсов

**🔧 Управление:**
- `./deploy.sh` - повторный деплой
- `docker-compose -f docker-compose.production.yml restart` - перезапуск
- `docker-compose -f docker-compose.production.yml down` - остановка

---

**Поддержка:** Если возникли проблемы, проверьте раздел Troubleshooting или создайте issue в репозитории.

**Статус:** ✅ PRODUCTION READY  
**Версия:** 1.0.0  
**Последнее обновление:** 6 января 2026
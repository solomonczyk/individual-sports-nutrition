# 🚀 Quick Start Guide - Запуск проекта

Пошаговая инструкция для запуска Individual Sports Nutrition Platform.

---

## Предварительные требования

### Установленное ПО:
- **Node.js** 18+ ([скачать](https://nodejs.org/))
- **PostgreSQL** 15+ ([скачать](https://www.postgresql.org/download/))
- **Git** ([скачать](https://git-scm.com/))
- **Expo CLI** (установится автоматически)

### Опционально:
- **Redis** (для кэширования)
- **Docker** (для контейнеризации)

---

## Шаг 1: Клонирование и установка

```bash
# Клонировать репозиторий (если еще не клонирован)
git clone <repository-url>
cd individual-sports-nutrition

# Установить зависимости для всех проектов
cd backend-api && npm install
cd ../mobile-app && npm install
cd ../admin-panel && npm install
cd ../ai-service && pip install -r requirements.txt
cd ..
```

---

## Шаг 2: Настройка базы данных

### Создать базу данных:

```bash
# Подключиться к PostgreSQL
psql -U postgres

# Создать базу данных
CREATE DATABASE nutrition_db;

# Создать пользователя (опционально)
CREATE USER nutrition_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nutrition_db TO nutrition_user;

# Выйти
\q
```

### Применить миграции:

```bash
cd database

# Применить все миграции по порядку
psql -U postgres -d nutrition_db -f migrations/001_initial_schema.sql
psql -U postgres -d nutrition_db -f migrations/002_health_profiles.sql
psql -U postgres -d nutrition_db -f migrations/003_products.sql
psql -U postgres -d nutrition_db -f migrations/004_recommendations.sql
psql -U postgres -d nutrition_db -f migrations/005_progress_tracking.sql
psql -U postgres -d nutrition_db -f migrations/006_localization.sql

# Новые миграции из фаз 9-11
cd ../backend-api
psql -U postgres -d nutrition_db -f migrations/007_aggregation_tables.sql
psql -U postgres -d nutrition_db -f migrations/008_aggregation_runs.sql
psql -U postgres -d nutrition_db -f migrations/009_serbian_cuisine.sql
```

---

## Шаг 3: Настройка переменных окружения

### Backend API:

```bash
cd backend-api
cp .env.example .env

# Отредактировать .env файл:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/nutrition_db
# JWT_SECRET=your-super-secret-key
# PORT=3000
```

### Mobile App:

```bash
cd mobile-app
cp .env.example .env

# Отредактировать .env файл:
# EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### Admin Panel:

```bash
cd admin-panel
cp .env.example .env

# Отредактировать .env файл:
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### AI Service:

```bash
cd ai-service
cp .env.example .env

# Отредактировать .env файл:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/nutrition_db
# OPENAI_API_KEY=your-openai-api-key
```

---

## Шаг 4: Запуск сервисов

### Вариант 1: Запуск через Docker (рекомендуется)

```bash
# Из корневой директории
docker-compose -f docker-compose.dev.yml up

# Сервисы будут доступны на:
# - Backend API: http://localhost:3000
# - Admin Panel: http://localhost:3001
# - AI Service: http://localhost:8000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Вариант 2: Запуск вручную

#### Терминал 1 - Backend API:
```bash
cd backend-api
npm run dev

# Сервер запустится на http://localhost:3000
# API доступен на http://localhost:3000/api/v1
```

#### Терминал 2 - AI Service:
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000

# Сервис запустится на http://localhost:8000
```

#### Терминал 3 - Mobile App:
```bash
cd mobile-app
npm start

# Expo DevTools откроется в браузере
# Выберите платформу:
# - Press 'a' для Android
# - Press 'i' для iOS
# - Press 'w' для Web
```

#### Терминал 4 - Admin Panel:
```bash
cd admin-panel
npm run dev

# Панель откроется на http://localhost:3001
```

---

## Шаг 5: Проверка работоспособности

### Backend API:

```bash
# Проверить health endpoint
curl http://localhost:3000/api/v1/health

# Ожидаемый ответ:
# {"status":"ok","timestamp":"...","service":"individual-sports-nutrition-api"}
```

### Проверить доступные endpoints:

```bash
# Получить популярные сербские блюда
curl http://localhost:3000/api/v1/serbian-cuisine/dishes/popular

# Получить список магазинов
curl http://localhost:3000/api/v1/admin/stores
```

### Mobile App:

1. Откройте Expo Go на телефоне
2. Отсканируйте QR код из терминала
3. Приложение загрузится на устройстве

### Admin Panel:

1. Откройте http://localhost:3001 в браузере
2. Увидите Dashboard с метриками

---

## Шаг 6: Тестирование

### Запустить все тесты:

```bash
# Backend API
cd backend-api
npm test

# Mobile App
cd mobile-app
npm test

# Admin Panel
cd admin-panel
npm test
```

### Запустить с coverage:

```bash
npm run test:coverage
```

---

## Структура проекта после запуска

```
http://localhost:3000     - Backend API
http://localhost:3000/api/v1/health - Health check
http://localhost:3001     - Admin Panel
http://localhost:8000     - AI Service
http://localhost:8081     - Mobile App (Expo)
```

---

## Полезные команды

### Backend API:
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run linter
```

### Mobile App:
```bash
npm start            # Start Expo
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in browser
npm test             # Run tests
npm run lint         # Run linter
```

### Admin Panel:
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter
```

---

## Troubleshooting

### Проблема: Backend не запускается

**Решение:**
```bash
# Проверить, что PostgreSQL запущен
psql -U postgres -c "SELECT version();"

# Проверить подключение к БД
psql -U postgres -d nutrition_db -c "SELECT COUNT(*) FROM users;"

# Проверить переменные окружения
cat backend-api/.env
```

### Проблема: Mobile app не подключается к API

**Решение:**
```bash
# Для Android эмулятора использовать:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1

# Для физического устройства использовать IP компьютера:
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api/v1

# Найти IP:
# Windows: ipconfig
# Mac/Linux: ifconfig
```

### Проблема: Миграции не применяются

**Решение:**
```bash
# Проверить текущую версию схемы
psql -U postgres -d nutrition_db -c "\dt"

# Применить миграции вручную по порядку
psql -U postgres -d nutrition_db -f migrations/001_initial_schema.sql
# ... и так далее
```

### Проблема: Port already in use

**Решение:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## Следующие шаги

После успешного запуска:

1. **Создать тестового пользователя:**
   - Зарегистрироваться через mobile app
   - Заполнить health profile

2. **Добавить тестовые данные:**
   - Продукты через admin panel
   - Магазины через admin panel

3. **Протестировать функционал:**
   - Рекомендации
   - Каталог продуктов
   - Сербская кухня
   - Трекинг прогресса

4. **Настроить production:**
   - Следовать SECURITY_GUIDE.md
   - Следовать PERFORMANCE_OPTIMIZATION.md
   - Настроить CI/CD

---

## Дополнительные ресурсы

- **TESTING_GUIDE.md** - Руководство по тестированию
- **SECURITY_GUIDE.md** - Безопасность
- **PERFORMANCE_OPTIMIZATION.md** - Оптимизация
- **PROJECT_COMPLETION_SUMMARY.md** - Обзор проекта

---

**Удачи с запуском! 🚀**

Если возникнут проблемы, проверьте логи в терминалах или создайте issue в репозитории.

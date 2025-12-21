# Руководство по запуску и тестированию приложения

Это пошаговое руководство поможет запустить и протестировать все компоненты приложения.

## Предварительные требования

### 1. Установленные программы:
- **Node.js** (v18+) - для Backend API и мобильного приложения
- **Python** (v3.9+) - для AI сервиса
- **PostgreSQL** (v14+) - база данных
- **Redis** (опционально) - кэширование
- **Expo CLI** - для мобильного приложения
- **Git** - для управления версиями

### 2. Проверка установки:
```bash
node --version    # Должно быть v18+
python --version  # Должно быть v3.9+
psql --version    # Проверка PostgreSQL
npm --version     # Проверка npm
```

---

## Шаг 1: Настройка базы данных

### 1.1. Создайте базу данных PostgreSQL:
```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE individual_sports_nutrition;

# Выйдите
\q
```

### 1.2. Запустите миграции:
```bash
# Перейдите в папку с миграциями
cd database/migrations

# Выполните миграции по порядку:
# Для Windows PowerShell:
psql -U postgres -d individual_sports_nutrition -f 001_initial_schema.sql
psql -U postgres -d individual_sports_nutrition -f 002_stores_and_prices.sql
psql -U postgres -d individual_sports_nutrition -f 003_ingredients_and_meals.sql
psql -U postgres -d individual_sports_nutrition -f 004_serbian_localization.sql

# Для Linux/Mac:
psql -U postgres -d individual_sports_nutrition < 001_initial_schema.sql
psql -U postgres -d individual_sports_nutrition < 002_stores_and_prices.sql
psql -U postgres -d individual_sports_nutrition < 003_ingredients_and_meals.sql
psql -U postgres -d individual_sports_nutrition < 004_serbian_localization.sql
```

---

## Шаг 2: Настройка Backend API

### 2.1. Установите зависимости:
```bash
cd backend-api
npm install
```

### 2.2. Создайте файл `.env` в папке `backend-api/`:
```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=individual_sports_nutrition
DB_USER=postgres
DB_PASSWORD=твой_пароль_postgres
DATABASE_URL=postgresql://postgres:твой_пароль_postgres@localhost:5432/individual_sports_nutrition

# Redis (опционально)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-secret-change-in-production-please
JWT_EXPIRES_IN=7d

# AI Service
AI_SERVICE_URL=http://localhost:8000

# CORS
CORS_ORIGIN=http://localhost:3001
```

### 2.3. Запустите Backend API:
```bash
# Development режим (с автоперезагрузкой)
npm run dev

# Или production режим
npm run build
npm start
```

**Backend API будет доступен на:** `http://localhost:3000`

### 2.4. Проверьте работу API:
Откройте в браузере или используйте curl:
```bash
# Проверка health endpoint
curl http://localhost:3000/api/v1/health

# Должен вернуть:
# {"status":"ok","timestamp":"...","service":"individual-sports-nutrition-api"}
```

---

## Шаг 3: Настройка AI Service

### 3.1. Установите зависимости:
```bash
cd ai-service

# Создайте виртуальное окружение (рекомендуется)
python -m venv venv

# Активируйте виртуальное окружение
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 3.2. Создайте файл `.env` в папке `ai-service/` (опционально):
```env
# Сервер
HOST=0.0.0.0
PORT=8000
DEBUG=false

# База данных (если нужно)
DATABASE_URL=postgresql://postgres:твой_пароль@localhost:5432/individual_sports_nutrition

# Redis (опционально)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Backend API
BACKEND_API_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3.3. Запустите AI Service:
```bash
# Используя uvicorn напрямую
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Или через run.py (если есть)
python run.py
```

**AI Service будет доступен на:** `http://localhost:8000`

### 3.4. Проверьте работу AI Service:
```bash
# Проверка health endpoint
curl http://localhost:8000/health

# Откройте документацию API
# В браузере: http://localhost:8000/docs
```

---

## Шаг 4: Настройка мобильного приложения

### 4.1. Установите зависимости:
```bash
cd mobile-app
npm install
```

### 4.2. Установите Expo CLI глобально (если еще не установлен):
```bash
npm install -g expo-cli
```

### 4.3. Настройте API endpoint:
Откройте файл `mobile-app/src/config/api.ts` и убедитесь, что `BASE_URL` указывает на ваш Backend API:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',  // Для эмулятора Android
  // BASE_URL: 'http://10.0.2.2:3000',  // Для реального устройства Android
  // BASE_URL: 'http://192.168.1.X:3000',  // Для реального устройства (замени X на IP твоего компьютера)
}
```

**Важно для реальных устройств:**
- **Android эмулятор**: используй `http://10.0.2.2:3000`
- **iOS симулятор**: используй `http://localhost:3000`
- **Реальное устройство**: используй IP адрес твоего компьютера в локальной сети (например, `http://192.168.1.100:3000`)

Чтобы узнать IP адрес:
- **Windows**: `ipconfig` (ищи IPv4 адрес)
- **Mac/Linux**: `ifconfig` или `ip addr`

### 4.4. Запустите мобильное приложение:
```bash
# Запуск Expo
npm start
# или
expo start

# Затем выбери:
# - Нажми 'a' для Android эмулятора
# - Нажми 'i' для iOS симулятора
# - Нажми 'w' для веб-версии
# - Отсканируй QR-код в Expo Go приложении на телефоне
```

---

## Шаг 5: Тестирование API

### 5.1. Тестирование через curl/Postman:

#### Регистрация пользователя:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "name": "Test User"
  }'
```

#### Авторизация:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

**Сохрани полученный токен** (он понадобится для следующих запросов)

#### Создание Health Profile:
```bash
curl -X POST http://localhost:3000/api/v1/health-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ТВОЙ_ТОКЕН" \
  -d '{
    "age": 30,
    "gender": "male",
    "height": 180,
    "weight": 75,
    "activity_level": "moderate",
    "goal": "maintain",
    "allergies": []
  }'
```

#### Получение рекомендаций:
```bash
curl -X GET http://localhost:3000/api/v1/recommendations \
  -H "Authorization: Bearer ТВОЙ_ТОКЕН"
```

#### Генерация плана питания:
```bash
curl -X POST http://localhost:3000/api/v1/meal-plan/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ТВОЙ_ТОКЕН" \
  -d '{
    "date": "2024-01-15",
    "preferences": {
      "cuisine_types": ["serbian"],
      "exclude_ingredients": []
    }
  }'
```

### 5.2. Тестирование через Swagger/Postman:

**Backend API:**
- Если есть Swagger документация, открой: `http://localhost:3000/api-docs`
- Или используй Postman для импорта endpoints

**AI Service:**
- Открой: `http://localhost:8000/docs` (FastAPI автоматическая документация)

---

## Шаг 6: Тестирование мобильного приложения

### 6.1. Флоу тестирования:

1. **Запусти приложение** через Expo
2. **Onboarding:**
   - Выбери язык (сербский по умолчанию)
   - Пройди введение
3. **Регистрация/Авторизация:**
   - Создай аккаунт или войди
4. **Создание Health Profile:**
   - Заполни данные профиля
   - Рассчитай план питания
5. **Главный экран:**
   - Проверь рекомендации продуктов
   - Проверь план питания на сегодня
6. **Прогресс:**
   - Проверь графики прогресса
   - Проверь историю

### 6.2. Типичные проблемы и решения:

**Проблема: Не подключается к API**
- Проверь, что Backend API запущен
- Проверь `BASE_URL` в `api.ts`
- Для реального устройства проверь IP адрес
- Проверь firewall настройки

**Проблема: Ошибка авторизации**
- Проверь, что токен сохраняется в AsyncStorage
- Проверь формат токена в заголовках

**Проблема: База данных не подключается**
- Проверь `.env` файл
- Проверь, что PostgreSQL запущен
- Проверь права доступа к БД

---

## Быстрый старт (краткая версия)

```bash
# 1. Настрой БД
psql -U postgres -c "CREATE DATABASE individual_sports_nutrition;"
cd database/migrations
psql -U postgres -d individual_sports_nutrition -f 001_initial_schema.sql
psql -U postgres -d individual_sports_nutrition -f 002_stores_and_prices.sql
psql -U postgres -d individual_sports_nutrition -f 003_ingredients_and_meals.sql
psql -U postgres -d individual_sports_nutrition -f 004_serbian_localization.sql

# 2. Backend API (в отдельном терминале)
cd backend-api
npm install
# Создай .env файл
npm run dev

# 3. AI Service (в отдельном терминале)
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload

# 4. Mobile App (в отдельном терминале)
cd mobile-app
npm install
npm start
```

---

## Полезные команды

### Проверка процессов:
```bash
# Windows
netstat -ano | findstr :3000  # Backend API
netstat -ano | findstr :8000  # AI Service

# Linux/Mac
lsof -i :3000
lsof -i :8000
```

### Остановка процессов:
```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill <PID>
```

---

## Дальнейшие шаги

После успешного запуска:
1. Заполни базу данных тестовыми продуктами и блюдами
2. Протестируй все основные флоу в мобильном приложении
3. Проверь работу AI рекомендаций
4. Проверь генерацию планов питания
5. Протестируй на реальных устройствах

---

**Вопросы?** Проверь логи каждого сервиса для диагностики проблем.


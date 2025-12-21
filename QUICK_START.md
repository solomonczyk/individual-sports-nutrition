# 🚀 Быстрый старт - Как запустить приложение

## ⚡ Самый быстрый способ запустить всё

### Шаг 1: База данных (1 минута)
```bash
# Создай БД
psql -U postgres -c "CREATE DATABASE individual_sports_nutrition;"

# Запусти миграции
cd database/migrations
psql -U postgres -d individual_sports_nutrition -f 001_initial_schema.sql
psql -U postgres -d individual_sports_nutrition -f 002_stores_and_prices.sql
psql -U postgres -d individual_sports_nutrition -f 003_ingredients_and_meals.sql
psql -U postgres -d individual_sports_nutrition -f 004_serbian_localization.sql
cd ../..
```

### Шаг 2: Backend API (2 минуты)
```bash
cd backend-api
npm install

# Создай .env файл:
cat > .env << EOF
NODE_ENV=development
PORT=3000
API_VERSION=v1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=individual_sports_nutrition
DB_USER=postgres
DB_PASSWORD=твой_пароль
DATABASE_URL=postgresql://postgres:твой_пароль@localhost:5432/individual_sports_nutrition
JWT_SECRET=dev-secret-change-in-production
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3001
EOF

npm run dev
```
✅ Backend запущен на http://localhost:3000

### Шаг 3: AI Service (2 минуты)
```bash
cd ai-service

# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
✅ AI Service запущен на http://localhost:8000

### Шаг 4: Мобильное приложение (2 минуты)

**Вариант 1: Быстрые скрипты (рекомендуется)**
```powershell
# Windows PowerShell
.\scripts\test-mobile.ps1        # Интерактивный запуск
.\scripts\test-mobile.ps1 android # Прямой запуск Android
.\scripts\test-web.ps1            # Веб-версия
```

```bash
# Linux/Mac
./scripts/test-mobile.sh        # Интерактивный запуск
./scripts/test-mobile.sh android # Прямой запуск Android
./scripts/test-web.sh            # Веб-версия
```

**Вариант 2: Ручной запуск**
```bash
cd mobile-app
npm install
npm start
```
✅ Приложение запущено. Нажми:
- `a` - для Android
- `i` - для iOS  
- `w` - для веб
- Отсканируй QR - для реального устройства

---

## 🧪 Быстрая проверка работы

### 1. Проверь Backend API:
```bash
curl http://localhost:3000/api/v1/health
```
Должно вернуть: `{"status":"ok",...}`

### 2. Проверь AI Service:
```bash
curl http://localhost:8000/health
```
Открой в браузере: http://localhost:8000/docs

### 3. Проверь мобильное приложение:
- Открой Expo Dev Tools в браузере
- Приложение должно запуститься

---

## ⚠️ Частые проблемы

**"База данных не подключается"**
- Проверь, что PostgreSQL запущен
- Проверь пароль в `.env`
- Проверь, что БД создана

**"Мобильное приложение не подключается к API"**
- Для Android эмулятора: используй `http://10.0.2.2:3000`
- Для реального устройства: используй IP твоего компьютера
- Проверь, что Backend API запущен

**"AI Service не запускается"**
- Проверь Python версию: `python --version` (должно быть 3.9+)
- Активируй виртуальное окружение
- Установи зависимости: `pip install -r requirements.txt`

---

## 📖 Подробная инструкция

- Полное руководство: [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)
- Скрипты для тестирования: [scripts/README-TEST-SCRIPTS.md](scripts/README-TEST-SCRIPTS.md)

---

**Готово!** 🎉 Теперь можно тестировать приложение.


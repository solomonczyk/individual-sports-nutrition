# 🚀 Инструкции по запуску

## Шаг 1: Установить зависимости Admin Panel

```powershell
cd F:\Dev\Projects\own_sport_food\admin-panel
npm install
```

## Шаг 2: Запустить Backend API (порт 3002)

```powershell
cd F:\Dev\Projects\own_sport_food\backend-api
npm run dev
```

Backend запустится на **http://localhost:3002**

## Шаг 3: Запустить Admin Panel (порт 3001)

В новом терминале:

```powershell
cd F:\Dev\Projects\own_sport_food\admin-panel
npm run dev
```

Admin Panel запустится на **http://localhost:3001**

---

## 🌐 URL для входа:

### Admin Panel (Dashboard)
**http://localhost:3001**

Откройте этот URL в браузере после запуска обоих сервисов.

---

## ✅ Проверка работоспособности:

### Backend API Health Check:
**http://localhost:3002/api/v1/health**

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "individual-sports-nutrition-api"
}
```

---

## 📊 Доступные страницы Admin Panel:

- **Dashboard:** http://localhost:3001/
- **Products:** http://localhost:3001/products
- **Stores:** http://localhost:3001/stores
- **Brands:** http://localhost:3001/brands

---

## 🔧 Если возникнут проблемы:

### Admin Panel не запускается:
```powershell
cd F:\Dev\Projects\own_sport_food\admin-panel
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

### Backend не подключается к БД:
Убедитесь, что PostgreSQL запущен и создана база данных `nutrition_db`

---

**Главный URL для входа: http://localhost:3001** 🎯

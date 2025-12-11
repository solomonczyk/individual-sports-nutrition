# Individual Sports Nutrition API

Backend API для мобильного приложения персонализированного спортивного питания.

## Технологии

- Node.js + Express
- TypeScript
- PostgreSQL
- Redis
- JWT Authentication

## Установка

```bash
npm install
```

## Настройка

Скопируйте `.env.example` в `.env` и заполните необходимые переменные окружения.

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Структура проекта

```
src/
├── config/        # Конфигурация (БД, env)
├── controllers/   # Контроллеры
├── middlewares/   # Middleware
├── models/        # Модели данных
├── routes/        # Маршруты API
├── services/      # Бизнес-логика
├── types/         # TypeScript типы
└── utils/         # Утилиты
```


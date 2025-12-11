# Individual Sports Nutrition AI Service

AI микросервис для персонализированного подбора спортивного питания.

## Технологии

- Python 3.11+
- FastAPI
- Pydantic
- Scikit-learn
- PostgreSQL
- Redis

## Установка

```bash
# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (Linux/Mac)
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Установка dev зависимостей
pip install -r requirements-dev.txt
```

## Настройка

Создайте файл `.env` в корне проекта:

```env
APP_NAME=Individual Sports Nutrition AI Service
DEBUG=true
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/individual_sports_nutrition
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
BACKEND_API_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

## Запуск

### Development

```bash
python run.py
```

или

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Структура проекта

```text
app/
├── config.py         # Конфигурация
├── main.py           # Точка входа FastAPI
├── models/           # Pydantic модели
├── routers/          # API роутеры
├── services/         # Бизнес-логика
├── utils/            # Утилиты (logger)
└── ml/               # ML модели и алгоритмы
```

## Тестирование

```bash
pytest
pytest --cov=app tests/
```

## Линтинг и форматирование

```bash
# Форматирование
black app/ tests/

# Линтинг
ruff check app/ tests/

# Проверка типов
mypy app/
```

# Дневник разработки проекта Individual Sports Nutrition

## Цель проекта
Персонализированное мобильное приложение для подбора спортивного питания с учётом здоровья, противопоказаний и локальной специфики сербского рынка.

## Технический стек (принят)
- **Frontend**: React Native (Expo) / Flutter (на выбор на этапе проектирования)
- **Backend API**: Node.js (Express) 
- **AI Service**: Python (FastAPI)
- **Базы данных**: PostgreSQL (основная), MongoDB (логи/аналитика), Redis (кэш)
- **Языки**: сербский, венгерский, румынский, английский, русский, украинский

## План: MVP за 90 дней (4 часа/день)

---

## Хронология работ

### День 1 (Сегодня) - 2025-01-XX
**Время**: [будет заполнено]

**Выполнено**:
- ✅ Ознакомление с документацией проекта
- ✅ Анализ требований и архитектуры
- ✅ Создание дневника разработки
- ✅ Создание базовой структуры папок проекта:
  - mobile-app/ (React Native Expo)
  - backend-api/ (Node.js)
  - ai-service/ (Python FastAPI)
  - database/ (migrations, seeders, schemas)
  - infra/ (docker, k8s, nginx, ci-cd)
  - docs/ (architecture, api-docs, ai-docs, product, legal)
  - scripts/

**Технический стек (финализирован)**:
- Frontend: React Native (Expo) - кроссплатформенное решение
- Backend: Node.js (Express) - основной API
- AI Service: Python (FastAPI) - микросервис для ML/рекомендаций
- БД: PostgreSQL (основная), MongoDB (логи), Redis (кэш)

**Выполнено** (продолжение):
- ✅ Инициализация backend-api (Node.js + Express + TypeScript):
  - package.json с зависимостями (Express, TypeScript, PostgreSQL, Redis, JWT, Zod)
  - tsconfig.json с strict режимом
  - Структура папок (controllers, services, models, routes, middlewares, utils, config, types)
  - Базовое Express приложение с middleware (CORS, Helmet, error handling)
  - Конфигурация окружения (.env)
  - Logger (Winston)
  - Health check endpoint
  - README.md

**Следующий шаг**: 
- Инициализация ai-service (Python FastAPI)

**Проблемы/Блокеры**: 
- Нет

**Время выполнения**: ~15 минут (структура) + ~20 минут (backend-api) = ~35 минут

**Выполнено** (продолжение):
- ✅ Организация структуры проекта:
  - Создана папка `docs/planning/` для документов планирования
  - Перемещены все документы планирования (16 файлов) в `docs/planning/`
  - В корне остались только рабочие файлы: `DEVELOPMENT_LOG.md` и README файлы проектов
- ✅ Инициализация ai-service (Python FastAPI):
  - requirements.txt с зависимостями (FastAPI, Uvicorn, Pydantic, Scikit-learn, PostgreSQL, Redis)
  - requirements-dev.txt (pytest, black, ruff, mypy)
  - pyproject.toml для линтеров и форматтеров
  - Структура папок (app/models, app/routers, app/services, app/utils, app/ml)
  - Базовое FastAPI приложение с CORS middleware
  - Конфигурация через Pydantic Settings
  - Health check endpoint
  - Logger (Loguru)
  - run.py для запуска сервиса
  - README.md

**Следующий шаг**: 
- Инициализация mobile-app (React Native Expo)

**Время выполнения**: ~35 минут (предыдущее) + ~25 минут (ai-service) = ~60 минут

**Выполнено** (продолжение):
- ✅ Переименование проекта на "Individual Sports Nutrition":
  - Обновлены все упоминания в файлах проекта (DEVELOPMENT_LOG.md, package.json, README, config файлы)
  - Изменены названия пакетов и сервисов:
    - `own-sport-food-api` → `individual-sports-nutrition-api`
    - `own-sport-food-ai-service` → `individual-sports-nutrition-ai-service`
    - `own-sport-food-mobile` → `individual-sports-nutrition-mobile`
  - Обновлены базы данных: `own_sport_food` → `individual_sports_nutrition`
  - Обновлены bundle identifiers и схемы в mobile-app
- ✅ Создан Git репозиторий:
  - Инициализирован репозиторий
  - Создан .gitignore
  - Создан главный README.md проекта
  - Выполнен первый коммит
- ✅ Подготовлена документация для деплоя:
  - Создана инструкция по настройке сервера (docs/deployment/server-setup.md)
  - Инструкции по установке Node.js, Python, PostgreSQL, Redis, Nginx
  - Настройка systemd сервисов
  - Инструкции по обновлению приложения
- ✅ Созданы скрипты для автоматизации деплоя:
  - `scripts/setup-remote-repo.sh` / `.ps1` - настройка удаленного репозитория (GitHub/GitLab/Bitbucket)
  - `scripts/deploy-to-server.sh` - автоматический деплой на сервер
  - `docs/deployment/quick-start.md` - пошаговое руководство по деплою
- ✅ Настроен удаленный Git репозиторий:
  - URL: `git@github.com:solomonczyk/individual-sports-nutrition.git`
  - Код успешно отправлен в репозиторий
  - Ветка `main` настроена для отслеживания `origin/main`
- ✅ Настроен SSH доступ без пароля к серверу:
  - SSH ключ установлен на сервере 152.53.227.37
  - Подключение по SSH теперь работает без ввода пароля
- ✅ Выполнен деплой приложения на сервер:
  - Обновлена система (Debian)
  - Установлены зависимости: Node.js 20, Python 3.11, PostgreSQL 15, Redis, Nginx, Git
  - Создан пользователь isnapp
  - Клонирован репозиторий
  - Создана БД individual_sports_nutrition
  - Установлены зависимости для Backend API и AI Service
  - Настроены .env файлы
  - Созданы и запущены systemd сервисы:
    - isn-backend.service (порт 3001) ✅ работает
    - isn-ai.service (порт 8000) ✅ работает
  - Исправлены ошибки конфигурации (REDIS_PASSWORD, CORS_ORIGINS)
  - Оба сервиса успешно запущены и отвечают на health checks

**Важно**: Порт 3000 занят другим проектом, поэтому backend работает на порту 3001.

**Выполнено** (продолжение):
- ✅ Создана структура базы данных:
  - ER-диаграмма (database/schemas/er-diagram.md)
  - SQL миграция (001_initial_schema.sql) - 12 таблиц + enum типы + индексы + триггеры
  - Миграция успешно применена на сервере
- ✅ Созданы TypeScript модели для всех сущностей:
  - User, HealthProfile, NutritionPlan, Product, UserProgress, Translation
  - Входные типы (Create, Update)
- ✅ Реализован API аутентификации:
  - POST /api/v1/auth/register - регистрация пользователя
  - POST /api/v1/auth/login - вход с JWT токеном
  - Middleware authMiddleware для защиты роутов
  - Хеширование паролей (bcrypt)
  - Валидация через Zod
- ✅ Реализован API профиля здоровья:
  - GET /api/v1/health-profile - получение профиля
  - POST /api/v1/health-profile - создание профиля
  - PUT /api/v1/health-profile - обновление профиля
  - Защищено middleware аутентификации
  - Валидация данных
- ✅ Реализована нутриционная логика:
  - Сервис расчета калорий (Mifflin-St Jeor формула)
  - Расчет BMR и TDEE с учетом уровня активности
  - Расчет БЖУ по целям (масса, сушка, поддержание, выносливость)
  - GET /api/v1/nutrition/calculate - расчет потребностей
  - GET /api/v1/nutrition-plan - получение плана питания
  - Автоматическое создание/обновление плана питания при расчете
- ✅ Мультиязычность:
  - Сервис переводов (TranslationService)
  - Локализация сообщений об ошибках (6 языков: sr, hu, ro, en, ru, ua)
  - Определение языка из заголовка Accept-Language

---


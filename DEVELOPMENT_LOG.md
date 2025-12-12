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
- ✅ API продуктов и брендов:
  - GET /api/v1/products - список продуктов с фильтрацией
  - GET /api/v1/products/:id - детали продукта
  - GET /api/v1/products/type/:type - продукты по типу
  - GET /api/v1/products/:id/contraindications - противопоказания продукта
  - GET /api/v1/products/brands - список брендов
  - GET /api/v1/products/brands/:id - детали бренда
- ✅ Система рекомендаций:
  - GET /api/v1/recommendations - рекомендации продуктов для пользователя
  - GET /api/v1/recommendations/products/:productId/check - проверка совместимости
  - Алгоритм оценки продуктов с учетом:
    * Цели пользователя (масса, сушка, поддержание, выносливость)
    * Уровня активности
    * Противопоказаний и заболеваний
    * Брендов и качества
  - Фильтрация продуктов с критическими противопоказаниями
  - Система баллов и ранжирования
- ✅ Расчет дозировок и интеграция с магазинами Сербии:
  - Структура БД для магазинов (stores), цен (product_prices), упаковок (product_packages)
  - История цен (price_history) для отслеживания изменений
  - Сервис расчета точного количества продуктов (DosageCalculator):
    * Индивидуальный расчет дневной дозировки по типу продукта
    * Учет целей, уровня активности, веса пользователя
    * Расчет на неделю/месяц с учетом частоты приема
  - Сервис сравнения цен (PriceComparisonService):
    * Сравнение цен одного продукта в разных магазинах
    * Поиск оптимальных вариантов покупки (как e-ponuda/t-commerce)
    * Расчет стоимости доставки и минимальной суммы заказа
    * Ранжирование вариантов по общей стоимости
  - API endpoints:
    * GET /api/v1/dosage/calculate - расчет дозировок для рекомендованных продуктов
    * GET /api/v1/dosage/shopping-options - варианты покупки с ценами из всех магазинов
    * GET /api/v1/dosage/products/:productId/prices - сравнение цен одного продукта
- ✅ Система планирования питания с ингредиентами и микроэлементами:
  - Структура БД:
    * ingredients - ингредиенты с полной нутриентной информацией (макро и микро)
    * meals - блюда/рецепты с расчетом нутриентов из ингредиентов
    * meal_ingredients - связь блюд и ингредиентов с количеством
    * daily_meal_plans - дневные планы питания пользователей
    * daily_meal_plan_items - блюда в дневном плане с расписанием
    * daily_meal_plan_supplements - добавки в дневном плане
  - Расчет нутриентов:
    * Макронутриенты: белки, жиры, углеводы, калории, клетчатка, сахар, виды жиров
    * Микронутриенты: все витамины (A, C, D, E, K, группа B) и минералы (Ca, Fe, Mg, P, K, Na, Zn, Cu, Mn, Se)
    * Автоматический расчет макро/микронутриентов блюда из ингредиентов
  - Генерация дневного плана питания:
    * Распределение калорий и БЖУ по приемам пищи (завтрак, обед, ужин, перекусы)
    * Подбор блюд с учетом целевых макронутриентов
    * Расписание приемов пищи с указанием времени
    * Интеграция добавок в расписание
  - API endpoints:
    * POST /api/v1/meal-plan/generate - генерация дневного плана питания
    * GET /api/v1/meal-plan/daily/:date - получение дневного плана
    * POST /api/v1/meal-plan/weekly - генерация недельного плана
  - Интеграция:
    * С планом питания пользователя (калории, БЖУ)
    * С рекомендациями добавок
    * С профилем здоровья и целями
- ✅ Локализация для сербского рынка:
  - Сербские магазины спортивного питания (Muscle Shop, Strong Shop, Fitness Centar, Body Shop, Sport Nutrition)
  - Сербские бренды (Proteini.sr, Strong Nutrition, Fitness Pro) и международные бренды доступные в Сербии
  - Сербская кухня и традиционные блюда:
    * Базовые ингредиенты (ćevapi, pljeskavica, kajmak, ajvar, prebranac, lepinja, somun)
    * Популярные блюда (burek, gibanica, proja, sarma, musaka, riblja čorba, pasulj)
  - Сербское расписание приемов пищи:
    * Завтрак: 7-9 (20% калорий)
    * Перекус: 10-11 (10%)
    * Обед: 13-15 (40% - главный прием пищи)
    * Перекус: 16-17 (10%)
    * Ужин: 19-21 (20%)
  - Приоритет сербской/балканской кухни при генерации планов питания
  - Валюта по умолчанию: RSD (сербский динар)
  - Язык по умолчанию: сербский (sr)

### День 33-38 — Frontend MVP: Онбординг и ввод данных

**Выполнено**:
- ✅ Настройка API клиента с interceptors (авторизация, язык)
- ✅ Сервисы: auth-service с методами register/login
- ✅ Мультиязычность (i18n):
  - Поддержка 6 языков (sr, hu, ro, en, ru, ua)
  - Zustand store для сохранения языка
  - i18n-js для переводов
- ✅ UI компоненты:
  - Button (primary, secondary, outline варианты)
  - Input (с валидацией и ошибками)
  - Утилита cn() для Tailwind классов
- ✅ Экраны онбординга:
  - Welcome (приветственный экран)
  - Language Selection (выбор языка из 6 вариантов)
  - Intro (3 шага знакомства с приложением)
- ✅ Навигация (Expo Router):
  - Root layout с поддержкой i18n
  - Группы маршрутов (onboarding, auth, tabs)
  - Автоматический редирект на основе авторизации
- ⏳ Экран авторизации (в процессе)

**Следующий шаг**: 
- Создать экраны login/register с формами и валидацией
- Интегрировать с API backend
- Добавить защиту роутов

**Выполнено** (продолжение):
- ✅ Экраны авторизации:
  - Login (email/password с валидацией)
  - Register (email/password/confirmPassword с проверкой совпадения)
  - Интеграция с API (authService)
  - Сохранение токена в Zustand (persist)
- ✅ Навигация (Expo Router):
  - Табы (Home, Profile, Progress, Settings)
  - Автоматический редирект на основе авторизации и наличия профиля
  - Layout группы (onboarding, auth, tabs)
- ✅ Личный кабинет:
  - Создание профиля здоровья (/health-profile/create):
    * Форма с валидацией (age, gender, weight, height, activity_level, goal)
    * Picker для выбора gender, activity_level, goal
    * Интеграция с API (healthProfileService)
  - Просмотр профиля (/(tabs)/profile):
    * Отображение всех данных профиля
    * Кнопка редактирования
    * Отображение аллергий, заболеваний, лекарств
  - Редактирование профиля (/health-profile/edit):
    * Загрузка существующих данных
    * Форма для обновления всех полей
    * Сохранение изменений через API
- ✅ Настройки (/(tabs)/settings):
  - Выбор языка (6 языков с иконкой выбранного)
  - Информация об аккаунте (email)
  - Кнопка выхода (logout)
- ✅ Главный экран (/(tabs)/home):
  - Приветствие пользователя
  - Placeholder для плана питания
- ✅ Экран прогресса (/(tabs)/progress):
  - Placeholder для графиков и статистики

### День 39-44 — Главный экран и рекомендации

**Выполнено**:
- ✅ Сервисы для главного экрана:
  - nutrition-service.ts (расчет потребностей)
  - nutrition-plan-service.ts (получение плана)
  - recommendations-service.ts (рекомендации продуктов, дозировки)
  - meal-plan-service.ts (дневной план питания)
- ✅ Типы данных:
  - nutrition.ts (NutritionCalculation, NutritionPlan)
  - recommendation.ts (ProductRecommendation, Dosage)
  - product.ts (Product, Brand)
  - meal-plan.ts (DailyMealPlan, Meal, MacroNutrients, MicroNutrients)
- ✅ UI компоненты:
  - LoadingSpinner (компонент загрузки)
  - EmptyState (компонент пустого состояния)
  - ProductCard (карточка продукта с макронутриентами, дозировкой, ценой)
  - MealCard (карточка приема пищи с расписанием, макронутриентами)
  - RecommendationList (список рекомендаций продуктов)
  - DailyMealPlan (дневной план питания с группировкой по типам приемов пищи)
- ✅ Главный экран (/(tabs)/home):
  - Интеграция с API (React Query)
  - Отображение плана питания (калории, БЖУ)
  - Отображение рекомендаций продуктов с дозировками
  - Отображение дневного плана питания
  - Pull-to-refresh функционал
  - Обработка состояний (loading, error, empty)
  - Кнопка генерации плана питания (если нет плана)

### День 45-50 — Трекинг прогресса

**Выполнено**:
- ✅ Типы данных для прогресса:
  - progress.ts (UserProgress, ProgressStats, WeightDataPoint, NutritionDataPoint)
- ✅ Сервис прогресса:
  - progress-service.ts (CRUD операции, статистика)
  - Добавлены endpoints в API config
- ✅ UI компоненты для прогресса:
  - ProgressChart (bar chart компонент)
  - LineChart (line chart компонент)
  - DailyProgressCard (карточка дневного прогресса с процентами выполнения целей)
  - ProgressHistory (история прогресса с карточками)
- ✅ Экран прогресса (/(tabs)/progress):
  - Выбор периода (7/30/90 дней)
  - Статистика (средние значения калорий, БЖУ, количество дней отслеживания)
  - Графики:
    * График калорий (line chart)
    * График макронутриентов (bar chart)
  - История прогресса (карточки за каждый день с прогресс-барами)
  - Pull-to-refresh функционал
  - Интеграция с API (meal plans)

**Следующий шаг**: 
- Настройки (полный функционал)
- Backend API endpoints для прогресса (если нужны дополнительные)
- Детальные экраны продуктов и блюд

### День 51-56 — Настройки и Backend API для прогресса

**Выполнено**:
- ✅ Backend API для прогресса:
  - user-progress-repository.ts (CRUD операции с БД)
  - user-progress-service.ts (бизнес-логика, статистика)
  - user-progress-controller.ts (HTTP обработчики)
  - routes/progress.ts (API endpoints: GET, POST, PUT, DELETE, GET /stats)
  - Интегрировано в основной router
- ✅ Обновлен экран настроек (/(tabs)/settings):
  - Профиль здоровья:
    * Просмотр текущего профиля (возраст, цель, уровень активности)
    * Переход на редактирование профиля
    * Отображение веса и роста
    * Отображение цели и уровня активности
  - Настройки:
    * Выбор языка (6 языков)
    * Уведомления (места для meal reminders, supplement reminders, progress updates)
  - Аккаунт:
    * Отображение email
    * Выход с подтверждением

**Следующий шаг**: 
- Детальные экраны продуктов и блюд
- AI модули (рекомендации, генерация планов)
- Интеграции и тестирование

---


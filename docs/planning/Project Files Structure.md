# Структура файловой системы проекта

```
/project-root
│
├── mobile-app/                # Мобильное приложение (Flutter/React Native)
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   └── assets/
│   └── package.json / pubspec.yaml
│
├── backend-api/               # Основной API (Node.js)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── utils/
│   ├── tests/
│   └── package.json
│
├── ai-service/                # AI-модуль (Python FastAPI)
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ml/
│   ├── tests/
│   └── requirements.txt
│
├── database/                  # Скрипты и миграции БД
│   ├── migrations/
│   ├── seeders/
│   └── schemas/
│
├── infra/                     # Инфраструктура (DevOps)
│   ├── docker/
│   ├── k8s/
│   ├── nginx/
│   └── ci-cd/
│
├── docs/                      # Документация проекта
│   ├── architecture/
│   ├── api-docs/
│   ├── ai-docs/
│   ├── product/
│   └── legal/
│
├── scripts/                   # Служебные скрипты
│
└── README.md                  # Основная информация о проекте
```

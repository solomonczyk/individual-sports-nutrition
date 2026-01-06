# Backend API Dockerfile
FROM node:20-alpine

# Установка зависимостей для сборки
RUN apk add --no-cache python3 make g++

# Создание рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка TypeScript
RUN npm run build

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Изменение владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Открытие порта
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Запуск приложения
CMD ["node", "dist/index.js"]
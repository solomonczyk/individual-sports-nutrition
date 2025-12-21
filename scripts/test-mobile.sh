#!/bin/bash
# Скрипт быстрого запуска мобильной версии для тестирования
# Использование: ./scripts/test-mobile.sh [android|ios]

PLATFORM="${1:-}"

echo "🚀 Запуск мобильной версии для тестирования..."
echo ""

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установи Node.js v18+ и повтори попытку."
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Установи npm и повтори попытку."
    exit 1
fi

# Переход в директорию мобильного приложения
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_APP_PATH="$SCRIPT_DIR/../mobile-app"

if [ ! -d "$MOBILE_APP_PATH" ]; then
    echo "❌ Директория mobile-app не найдена: $MOBILE_APP_PATH"
    exit 1
fi

cd "$MOBILE_APP_PATH" || exit 1
echo "📁 Рабочая директория: $MOBILE_APP_PATH"

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки зависимостей"
        exit 1
    fi
fi

# Выбор платформы
if [ "$PLATFORM" = "android" ]; then
    echo "🤖 Запуск для Android..."
    npm run android
elif [ "$PLATFORM" = "ios" ]; then
    echo "🍎 Запуск для iOS..."
    npm run ios
else
    echo "📱 Запуск Expo (выбери платформу в меню)..."
    echo "   Нажми 'a' для Android"
    echo "   Нажми 'i' для iOS"
    echo "   Нажми 'w' для веб-версии"
    echo ""
    npm start
fi


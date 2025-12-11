#!/bin/bash

# Скрипт для деплоя на сервер
# Использование: ./scripts/deploy-to-server.sh

SERVER_IP="152.53.227.37"
SERVER_USER="root"
PROJECT_DIR="/home/isnapp/individual-sports-nutrition"

echo "=========================================="
echo "Деплой Individual Sports Nutrition на сервер"
echo "=========================================="
echo ""

# Проверка SSH подключения
echo "Проверка SSH подключения к серверу..."
if ssh -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
    echo "✓ SSH подключение работает"
else
    echo "✗ Ошибка: не удалось подключиться к серверу"
    echo "Проверьте:"
    echo "  - IP адрес: $SERVER_IP"
    echo "  - SSH ключи настроены"
    echo "  - Сервер доступен"
    exit 1
fi

echo ""
echo "Выберите действие:"
echo "1) Первый деплой (клонирование и настройка)"
echo "2) Обновление (git pull и перезапуск сервисов)"
echo "3) Только перезапуск сервисов"
read -r choice

case $choice in
    1)
        echo ""
        echo "Первый деплой..."
        ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
            # Создание пользователя если не существует
            if ! id -u isnapp >/dev/null 2>&1; then
                echo "Создание пользователя isnapp..."
                adduser --disabled-password --gecos "" isnapp
                usermod -aG sudo isnapp
            fi
            
            # Установка базовых зависимостей
            echo "Обновление системы..."
            apt update && apt upgrade -y
            
            echo "Установка Node.js, Python, PostgreSQL, Redis, Nginx..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs python3.11 python3.11-venv python3-pip postgresql postgresql-contrib redis-server nginx git
            
            # Переключение на пользователя isnapp
            su - isnapp << 'ENDUSER'
                cd ~
                
                # Клонирование репозитория (нужно указать URL)
                echo "ВНИМАНИЕ: Нужно указать URL репозитория!"
                echo "Используйте: git clone <your-repo-url> individual-sports-nutrition"
            ENDUSER
ENDSSH
        echo ""
        echo "⚠️  Первый деплой требует ручной настройки:"
        echo "  1. Подключитесь к серверу: ssh root@$SERVER_IP"
        echo "  2. Следуйте инструкциям из docs/deployment/server-setup.md"
        ;;
    2)
        echo ""
        echo "Обновление приложения на сервере..."
        ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
            cd $PROJECT_DIR
            
            echo "Получение последних изменений..."
            git pull origin main
            
            echo "Обновление Backend API..."
            cd backend-api
            npm install
            npm run build
            sudo systemctl restart isn-backend
            
            echo "Обновление AI Service..."
            cd ../ai-service
            source venv/bin/activate
            pip install -r requirements.txt
            sudo systemctl restart isn-ai
            
            echo "Проверка статуса сервисов..."
            sudo systemctl status isn-backend --no-pager -l
            sudo systemctl status isn-ai --no-pager -l
ENDSSH
        echo ""
        echo "✓ Обновление завершено"
        ;;
    3)
        echo ""
        echo "Перезапуск сервисов..."
        ssh "$SERVER_USER@$SERVER_IP" "sudo systemctl restart isn-backend isn-ai && sudo systemctl status isn-backend isn-ai --no-pager"
        echo ""
        echo "✓ Сервисы перезапущены"
        ;;
    *)
        echo "Неверный выбор"
        exit 1
        ;;
esac


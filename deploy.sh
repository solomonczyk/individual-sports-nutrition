#!/bin/bash

# 🚀 Individual Sports Nutrition - Production Deployment Script
# Использование: ./deploy.sh

set -e

echo "=========================================="
echo "🚀 Individual Sports Nutrition Deployment"
echo "=========================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен. Установите Docker и повторите попытку."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен. Установите Docker Compose и повторите попытку."
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка конфигурации
check_config() {
    log_info "Проверка конфигурации..."
    
    if [ ! -f ".env.production" ]; then
        log_warning "Файл .env.production не найден"
        log_info "Создание .env.production из примера..."
        cp .env.production.example .env.production
        log_warning "ВАЖНО: Отредактируйте .env.production с реальными значениями!"
        log_warning "Особенно: DB_PASSWORD, JWT_SECRET, CORS_ORIGIN"
        read -p "Нажмите Enter после редактирования .env.production..."
    fi
    
    log_success "Конфигурация проверена"
}

# Создание необходимых директорий
create_directories() {
    log_info "Создание необходимых директорий..."
    
    mkdir -p logs/nginx
    mkdir -p nginx/ssl
    
    log_success "Директории созданы"
}

# Сборка и запуск контейнеров
deploy_containers() {
    log_info "Сборка и запуск контейнеров..."
    
    # Остановка существующих контейнеров
    log_info "Остановка существующих контейнеров..."
    docker-compose -f docker-compose.production.yml down || true
    
    # Сборка образов
    log_info "Сборка образов..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Запуск контейнеров
    log_info "Запуск контейнеров..."
    docker-compose -f docker-compose.production.yml up -d
    
    log_success "Контейнеры запущены"
}

# Ожидание готовности сервисов
wait_for_services() {
    log_info "Ожидание готовности сервисов..."
    
    # Ожидание PostgreSQL
    log_info "Ожидание PostgreSQL..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U app_user -d individual_sports_nutrition &> /dev/null; then
            log_success "PostgreSQL готов"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Ожидание Redis
    log_info "Ожидание Redis..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping &> /dev/null; then
            log_success "Redis готов"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Ожидание Backend API
    log_info "Ожидание Backend API..."
    for i in {1..60}; do
        if curl -s http://localhost:3006/health &> /dev/null; then
            log_success "Backend API готов"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Ожидание Admin Panel
    log_info "Ожидание Admin Panel..."
    for i in {1..60}; do
        if curl -s http://localhost:3007/ &> /dev/null; then
            log_success "Admin Panel готов"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Ожидание Nginx
    log_info "Ожидание Nginx..."
    for i in {1..30}; do
        if curl -s http://localhost:8090/health &> /dev/null; then
            log_success "Nginx готов"
            break
        fi
        echo -n "."
        sleep 2
    done
}

# Проверка здоровья сервисов
health_check() {
    log_info "Проверка здоровья сервисов..."
    
    # Проверка Backend API
    if curl -s http://localhost:8090/api/v1/health | grep -q "ok"; then
        log_success "✅ Backend API здоров"
    else
        log_error "❌ Backend API не отвечает"
        return 1
    fi
    
    # Проверка Admin Panel
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/ | grep -q "200"; then
        log_success "✅ Admin Panel доступен"
    else
        log_error "❌ Admin Panel недоступен"
        return 1
    fi
    
    # Проверка базы данных через API
    if curl -s http://localhost:8090/api/v1/ready | grep -q "ready"; then
        log_success "✅ База данных подключена"
    else
        log_error "❌ Проблемы с базой данных"
        return 1
    fi
    
    log_success "Все сервисы здоровы!"
}

# Показать статус
show_status() {
    echo ""
    echo "=========================================="
    echo "📊 Статус развертывания"
    echo "=========================================="
    
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    echo "🌐 Доступные URL:"
    echo "  • Admin Panel: http://localhost:8090/"
    echo "  • Backend API: http://localhost:8090/api/v1/"
    echo "  • Health Check: http://localhost:8090/health"
    echo "  • Direct Backend: http://localhost:3006/"
    echo "  • Direct Admin: http://localhost:3007/"
    echo ""
    echo "📋 Управление:"
    echo "  • Просмотр логов: docker-compose -f docker-compose.production.yml logs -f"
    echo "  • Перезапуск: docker-compose -f docker-compose.production.yml restart"
    echo "  • Остановка: docker-compose -f docker-compose.production.yml down"
    echo ""
}

# Основная функция
main() {
    log_info "Начало развертывания Individual Sports Nutrition..."
    
    check_dependencies
    check_config
    create_directories
    deploy_containers
    wait_for_services
    
    if health_check; then
        log_success "🎉 Развертывание завершено успешно!"
        show_status
    else
        log_error "❌ Развертывание завершилось с ошибками"
        log_info "Проверьте логи: docker-compose -f docker-compose.production.yml logs"
        exit 1
    fi
}

# Обработка сигналов
trap 'log_error "Развертывание прервано"; exit 1' INT TERM

# Запуск
main "$@"
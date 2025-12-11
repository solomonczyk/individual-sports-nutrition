#!/bin/bash

# Скрипт для настройки удаленного репозитория
# Использование: ./scripts/setup-remote-repo.sh <repo-url>

if [ -z "$1" ]; then
    echo "Использование: $0 <repository-url>"
    echo "Пример: $0 https://github.com/username/individual-sports-nutrition.git"
    exit 1
fi

REPO_URL=$1

echo "Настройка удаленного репозитория: $REPO_URL"
echo ""

# Проверка существования remote
if git remote | grep -q "^origin$"; then
    echo "Remote 'origin' уже существует. Заменить? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git remote remove origin
    else
        echo "Отменено."
        exit 0
    fi
fi

# Добавление remote
git remote add origin "$REPO_URL"

# Проверка подключения
echo "Проверка подключения к удаленному репозиторию..."
if git ls-remote --heads origin > /dev/null 2>&1; then
    echo "✓ Успешное подключение к репозиторию"
else
    echo "✗ Ошибка: не удалось подключиться к репозиторию"
    echo "Проверьте URL и права доступа"
    exit 1
fi

# Пуш в удаленный репозиторий
echo ""
echo "Отправка кода в удаленный репозиторий..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Код успешно отправлен в удаленный репозиторий"
    echo ""
    echo "Для проверки:"
    echo "  git remote -v"
    echo "  git branch -a"
else
    echo ""
    echo "✗ Ошибка при отправке кода"
    echo "Возможные причины:"
    echo "  - Репозиторий не пустой (используйте --force, если уверены)"
    echo "  - Нет прав на запись"
    echo "  - Проблемы с сетью"
    exit 1
fi


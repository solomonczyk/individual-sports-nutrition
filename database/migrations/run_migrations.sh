#!/bin/bash

# Скрипт для запуска миграций базы данных
# Использование: ./run_migrations.sh [database_url]

set -e

DATABASE_URL="${1:-postgresql://isn_user:secure_password_change_me@localhost:5432/individual_sports_nutrition}"

echo "Running database migrations..."
echo "Database: $DATABASE_URL"
echo ""

# Получаем список миграций в порядке их создания
MIGRATIONS_DIR="$(dirname "$0")"
MIGRATION_FILES=($(ls -1 "$MIGRATIONS_DIR"/*.sql | sort))

for migration_file in "${MIGRATION_FILES[@]}"; do
    migration_name=$(basename "$migration_file")
    echo "Executing: $migration_name"
    PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') psql "$DATABASE_URL" -f "$migration_file"
    echo "✓ Completed: $migration_name"
    echo ""
done

echo "All migrations completed successfully!"


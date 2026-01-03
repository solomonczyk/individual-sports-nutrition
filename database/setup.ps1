# PowerShell script to setup PostgreSQL database
# Run this with: .\setup.ps1

Write-Host "🚀 Setting up Individual Sports Nutrition Database..." -ForegroundColor Cyan

# Check if PostgreSQL is installed
Write-Host "`n📋 Checking PostgreSQL installation..." -ForegroundColor Yellow
$psqlVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PostgreSQL is not installed!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PostgreSQL found: $psqlVersion" -ForegroundColor Green

# Step 1: Create database
Write-Host "`n📦 Step 1: Creating database..." -ForegroundColor Yellow
psql -U postgres -f setup-database.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database!" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL is running and you have the correct password." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Database created!" -ForegroundColor Green

# Step 2: Apply migrations from database folder
Write-Host "`n🔄 Step 2: Applying migrations..." -ForegroundColor Yellow
psql -U postgres -d nutrition_db -f apply-all-migrations.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some migrations may have failed, but continuing..." -ForegroundColor Yellow
}

# Step 3: Apply backend migrations
Write-Host "`n🔄 Step 3: Applying backend migrations..." -ForegroundColor Yellow
$backendMigrations = @(
    "../backend-api/migrations/007_aggregation_tables.sql",
    "../backend-api/migrations/008_aggregation_runs.sql",
    "../backend-api/migrations/009_serbian_cuisine.sql"
)

foreach ($migration in $backendMigrations) {
    if (Test-Path $migration) {
        Write-Host "  Applying: $migration" -ForegroundColor Cyan
        psql -U postgres -d nutrition_db -f $migration
    }
}
Write-Host "✅ Migrations applied!" -ForegroundColor Green

# Step 4: Seed test data
Write-Host "`n🌱 Step 4: Seeding test data..." -ForegroundColor Yellow
psql -U postgres -d nutrition_db -f seed-data.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some seed data may have failed, but continuing..." -ForegroundColor Yellow
}
Write-Host "✅ Test data seeded!" -ForegroundColor Green

# Success!
Write-Host "`n🎉 Database setup complete!" -ForegroundColor Green
Write-Host "`n📊 Database Info:" -ForegroundColor Cyan
Write-Host "  Database: nutrition_db" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  User: postgres" -ForegroundColor White

Write-Host "`n🔗 Connection String:" -ForegroundColor Cyan
Write-Host "  postgresql://postgres:postgres@localhost:5432/nutrition_db" -ForegroundColor White

Write-Host "`n✨ Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart Backend API (Ctrl+C and npm run dev)" -ForegroundColor White
Write-Host "  2. Refresh Admin Panel in browser (F5)" -ForegroundColor White
Write-Host "  3. See real data in Dashboard!" -ForegroundColor White

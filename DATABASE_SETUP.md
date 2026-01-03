# 🗄️ PostgreSQL Setup Guide

Quick guide to setup PostgreSQL database for the project.

---

## Option 1: Automated Setup (Recommended) ⚡

### Run the setup script:

```powershell
cd F:\Dev\Projects\own_sport_food\database
.\setup.ps1
```

This will:
1. ✅ Create `nutrition_db` database
2. ✅ Apply all migrations
3. ✅ Seed test data
4. ✅ Show connection info

---

## Option 2: Manual Setup 🔧

### Step 1: Install PostgreSQL

Download and install from: https://www.postgresql.org/download/windows/

Default settings:
- Port: 5432
- User: postgres
- Password: (set during installation)

### Step 2: Create Database

```powershell
cd F:\Dev\Projects\own_sport_food\database
psql -U postgres -f setup-database.sql
```

### Step 3: Apply Migrations

```powershell
# Database migrations
psql -U postgres -d nutrition_db -f apply-all-migrations.sql

# Backend migrations
psql -U postgres -d nutrition_db -f ../backend-api/migrations/007_aggregation_tables.sql
psql -U postgres -d nutrition_db -f ../backend-api/migrations/008_aggregation_runs.sql
psql -U postgres -d nutrition_db -f ../backend-api/migrations/009_serbian_cuisine.sql
```

### Step 4: Seed Test Data

```powershell
psql -U postgres -d nutrition_db -f seed-data.sql
```

---

## Verify Setup ✅

Check if database is ready:

```powershell
psql -U postgres -d nutrition_db -c "\dt"
```

Should show tables:
- users
- brands
- products
- stores
- product_prices
- serbian_dishes
- and more...

---

## Update Backend Configuration

Make sure `backend-api/.env` has correct credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nutrition_db
DB_PASSWORD=YOUR_PASSWORD
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

## Restart Services

After database setup:

1. **Restart Backend API:**
   ```powershell
   cd F:\Dev\Projects\own_sport_food\backend-api
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Refresh Admin Panel:**
   - Open http://localhost:3001
   - Press F5 to refresh
   - See real data! 🎉

---

## Test Data Included 📊

The seed script adds:
- **1 test user:** test@example.com
- **4 brands:** Optimum Nutrition, MyProtein, Scitec, BioTech
- **3 products:** Whey proteins and creatine
- **2 stores:** X Sport, NSSport
- **10 Serbian dishes:** Ćevapi, Pljeskavica, Sarma, etc.

---

## Troubleshooting 🔧

### Error: "psql: command not found"

PostgreSQL is not installed or not in PATH.

**Solution:**
1. Install PostgreSQL
2. Add to PATH: `C:\Program Files\PostgreSQL\15\bin`
3. Restart PowerShell

### Error: "password authentication failed"

Wrong password in connection string.

**Solution:**
Update `backend-api/.env`:
```env
DB_PASSWORD=your_actual_password
```

### Error: "database already exists"

Database was created before.

**Solution:**
Drop and recreate:
```powershell
psql -U postgres -c "DROP DATABASE nutrition_db;"
psql -U postgres -f setup-database.sql
```

### Error: "relation already exists"

Migrations were partially applied.

**Solution:**
Drop database and start fresh:
```powershell
psql -U postgres -c "DROP DATABASE nutrition_db;"
.\setup.ps1
```

---

## Quick Commands 📝

```powershell
# Connect to database
psql -U postgres -d nutrition_db

# List tables
\dt

# View users
SELECT * FROM users;

# View products
SELECT p.name, b.name as brand FROM products p JOIN brands b ON p.brand_id = b.id;

# View Serbian dishes
SELECT name_sr, calories_per_100g, protein_per_100g FROM serbian_dishes;

# Exit
\q
```

---

## Next Steps 🚀

After successful setup:

1. ✅ Database is ready
2. ✅ Test data is loaded
3. ✅ Restart Backend API
4. ✅ Refresh Admin Panel
5. ✅ See real metrics and data!

---

**Need help?** Check the error messages in Backend API terminal.

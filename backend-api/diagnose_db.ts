import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'individual_sports_nutrition',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function diagnose() {
    console.log('--- Database Diagnosis ---');
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database.');

        const mealsCount = await client.query('SELECT COUNT(*) FROM meals;');
        console.log(`Meals count: ${mealsCount.rows[0].count}`);

        const ingredientsCount = await client.query('SELECT COUNT(*) FROM ingredients;');
        console.log(`Ingredients count: ${ingredientsCount.rows[0].count}`);

        const users = await client.query('SELECT id, email, preferred_language FROM users;');
        console.log('Users:', users.rows);

        const profiles = await client.query('SELECT user_id, goal FROM health_profiles;');
        console.log('Health Profiles:', profiles.rows);

        const nutritionPlans = await client.query('SELECT id, user_id, calories FROM nutrition_plans;');
        console.log('Nutrition Plans:', nutritionPlans.rows);

        const functions = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'calculate_meal_macros';");
        console.log('Functions found:', functions.rows.map(r => r.routine_name));

        client.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
    } finally {
        await pool.end();
    }
}

diagnose();

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'individual_sports_nutrition',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function seedMissingData() {
    console.log('--- Seeding Missing Data for All Users ---');
    try {
        const client = await pool.connect();

        // 1. Get all users
        const usersRes = await client.query('SELECT id FROM users;');
        const users = usersRes.rows;
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            const userId = user.id;

            // 2. Ensure health profile exists
            const profileRes = await client.query('SELECT id FROM health_profiles WHERE user_id = $1;', [userId]);
            if (profileRes.rows.length === 0) {
                console.log(`Creating default health profile for user ${userId}`);
                await client.query(`
          INSERT INTO health_profiles (user_id, age, gender, weight, height, activity_level, goal, allergies, diseases, medications)
          VALUES ($1, 25, 'male', 75, 180, 'high', 'mass', '[]', '[]', '[]');
        `, [userId]);
            } else {
                // If profile exists but is empty (nulls), update it
                const checkEmpty = await client.query('SELECT goal FROM health_profiles WHERE user_id = $1;', [userId]);
                if (!checkEmpty.rows[0].goal) {
                    console.log(`Updating empty health profile for user ${userId}`);
                    await client.query(`
            UPDATE health_profiles 
            SET age = 25, gender = 'male', weight = 75, height = 180, activity_level = 'high', goal = 'mass'
            WHERE user_id = $1;
          `, [userId]);
                }
            }

            // 3. Ensure nutrition plan exists
            const planRes = await client.query('SELECT id FROM nutrition_plans WHERE user_id = $1;', [userId]);
            if (planRes.rows.length === 0) {
                console.log(`Creating default nutrition plan for user ${userId}`);
                await client.query(`
          INSERT INTO nutrition_plans (user_id, calories, protein, carbs, fats, active)
          VALUES ($1, 2500, 180, 300, 70, true);
        `, [userId]);
            }
        }

        console.log('Seeding completed successfully.');
        client.release();
    } catch (error) {
        console.error('Seeding failed:', error.message);
    } finally {
        await pool.end();
    }
}

seedMissingData();

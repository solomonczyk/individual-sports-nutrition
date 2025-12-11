import { Pool } from 'pg'
import { config } from './env'

export const pool = new Pool({
  host: config.DB_HOST,
  port: parseInt(config.DB_PORT || '5432', 10),
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})


import dotenv from 'dotenv'

dotenv.config()

interface EnvConfig {
  NODE_ENV: string
  PORT: string
  API_VERSION: string
  DATABASE_URL: string
  DB_HOST: string
  DB_PORT: string
  DB_NAME: string
  DB_USER: string
  DB_PASSWORD: string
  REDIS_HOST: string
  REDIS_PORT: string
  REDIS_PASSWORD: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  AI_SERVICE_URL: string
  CORS_ORIGIN: string
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const config: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvVar('PORT', '3000'),
  API_VERSION: getEnvVar('API_VERSION', 'v1'),
  DATABASE_URL: getEnvVar('DATABASE_URL', ''),
  DB_HOST: getEnvVar('DB_HOST', 'localhost'),
  DB_PORT: getEnvVar('DB_PORT', '5432'),
  DB_NAME: getEnvVar('DB_NAME', 'individual_sports_nutrition'),
  DB_USER: getEnvVar('DB_USER', 'postgres'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD', ''),
  REDIS_HOST: getEnvVar('REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnvVar('REDIS_PORT', '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  JWT_SECRET: getEnvVar('JWT_SECRET', 'dev-secret-change-in-production'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  AI_SERVICE_URL: getEnvVar('AI_SERVICE_URL', 'http://localhost:8000'),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:3001,http://localhost:8081'),
}


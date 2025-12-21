/**
 * Test setup file for backend-api
 * Initializes test environment, mocks, and fixtures
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// Mock environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nutrition_test'
  process.env.REDIS_HOST = 'localhost'
  process.env.REDIS_PORT = '6379'
  process.env.JWT_SECRET = 'test-secret-key'
  process.env.API_VERSION = 'v1'
})

// Clean up after all tests
afterAll(() => {
  vi.clearAllMocks()
})

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Global test timeout
process.env.TEST_TIMEOUT = '10000'

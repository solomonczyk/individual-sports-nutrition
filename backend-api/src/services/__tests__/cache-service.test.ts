import { CacheService } from '../cache-service'
import { createClient } from 'redis'

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('CacheService', () => {
  let cacheService: CacheService
  let mockRedisClient: any

  beforeEach(() => {
    mockRedisClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      flushAll: jest.fn(),
      ping: jest.fn(),
      on: jest.fn(),
    }

    mockCreateClient.mockReturnValue(mockRedisClient)
    cacheService = new CacheService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined)

      await cacheService.connect()

      expect(mockRedisClient.connect).toHaveBeenCalled()
    })

    it('should handle connection errors gracefully', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'))

      // Should not throw error
      await expect(cacheService.connect()).resolves.toBeUndefined()
    })
  })

  describe('get', () => {
    it('should return parsed value for existing key', async () => {
      const testData = { name: 'test', value: 123 }
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData))
      ;(cacheService as any).isConnected = true

      const result = await cacheService.get('test-key')

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key')
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null)
      ;(cacheService as any).isConnected = true

      const result = await cacheService.get('non-existent-key')

      expect(result).toBeNull()
    })

    it('should return null when not connected', async () => {
      ;(cacheService as any).isConnected = false

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
      expect(mockRedisClient.get).not.toHaveBeenCalled()
    })

    it('should handle JSON parse errors', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json')
      ;(cacheService as any).isConnected = true

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should set value without TTL', async () => {
      const testData = { name: 'test', value: 123 }
      mockRedisClient.set.mockResolvedValue('OK')
      ;(cacheService as any).isConnected = true

      const result = await cacheService.set('test-key', testData)

      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData))
      expect(result).toBe(true)
    })

    it('should set value with TTL', async () => {
      const testData = { name: 'test', value: 123 }
      mockRedisClient.setEx.mockResolvedValue('OK')
      ;(cacheService as any).isConnected = true

      const result = await cacheService.set('test-key', testData, 3600)

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(testData))
      expect(result).toBe(true)
    })

    it('should return false when not connected', async () => {
      ;(cacheService as any).isConnected = false

      const result = await cacheService.set('test-key', { test: 'data' })

      expect(result).toBe(false)
      expect(mockRedisClient.set).not.toHaveBeenCalled()
    })
  })

  describe('del', () => {
    it('should delete key successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1)
      ;(cacheService as any).isConnected = true

      const result = await cacheService.del('test-key')

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key')
      expect(result).toBe(true)
    })

    it('should return false when not connected', async () => {
      ;(cacheService as any).isConnected = false

      const result = await cacheService.del('test-key')

      expect(result).toBe(false)
      expect(mockRedisClient.del).not.toHaveBeenCalled()
    })
  })

  describe('cacheFunction', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { name: 'cached', value: 456 }
      const mockFunction = jest.fn().mockResolvedValue({ name: 'fresh', value: 789 })
      
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData))
      ;(cacheService as any).isConnected = true

      const result = await cacheService.cacheFunction('test-key', mockFunction, 3600)

      expect(result).toEqual(cachedData)
      expect(mockFunction).not.toHaveBeenCalled()
    })

    it('should execute function and cache result if not cached', async () => {
      const freshData = { name: 'fresh', value: 789 }
      const mockFunction = jest.fn().mockResolvedValue(freshData)
      
      mockRedisClient.get.mockResolvedValue(null)
      mockRedisClient.setEx.mockResolvedValue('OK')
      ;(cacheService as any).isConnected = true

      const result = await cacheService.cacheFunction('test-key', mockFunction, 3600)

      expect(result).toEqual(freshData)
      expect(mockFunction).toHaveBeenCalled()
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(freshData))
    })

    it('should execute function if cache fails', async () => {
      const freshData = { name: 'fresh', value: 789 }
      const mockFunction = jest.fn().mockResolvedValue(freshData)
      
      mockRedisClient.get.mockRejectedValue(new Error('Cache error'))
      ;(cacheService as any).isConnected = true

      const result = await cacheService.cacheFunction('test-key', mockFunction, 3600)

      expect(result).toEqual(freshData)
      expect(mockFunction).toHaveBeenCalled()
    })
  })

  describe('generateKey', () => {
    it('should generate cache key correctly', () => {
      const key = CacheService.generateKey('products', 'user-123', 'category-456')
      expect(key).toBe('products:user-123:category-456')
    })

    it('should handle single part', () => {
      const key = CacheService.generateKey('users')
      expect(key).toBe('users:')
    })

    it('should handle mixed types', () => {
      const key = CacheService.generateKey('products', 123, 'active', 456)
      expect(key).toBe('products:123:active:456')
    })
  })

  describe('healthCheck', () => {
    it('should return true for healthy Redis', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')
      ;(cacheService as any).isConnected = true

      const result = await cacheService.healthCheck()

      expect(result).toBe(true)
      expect(mockRedisClient.ping).toHaveBeenCalled()
    })

    it('should return false when not connected', async () => {
      ;(cacheService as any).isConnected = false

      const result = await cacheService.healthCheck()

      expect(result).toBe(false)
      expect(mockRedisClient.ping).not.toHaveBeenCalled()
    })

    it('should return false on ping error', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Ping failed'))
      ;(cacheService as any).isConnected = true

      const result = await cacheService.healthCheck()

      expect(result).toBe(false)
    })
  })
})
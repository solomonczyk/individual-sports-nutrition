import { createClient, RedisClientType } from 'redis'
import { config } from '../config/env'
import { logger } from '../utils/logger'

export class CacheService {
  private client: RedisClientType
  private isConnected: boolean = false

  constructor() {
    this.client = createClient({
      url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
      password: config.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 5000,
      },
    })

    this.client.on('error', (err) => {
      // Only log first error to avoid spam
      if (this.isConnected) {
        logger.warn('Redis Client Error - continuing without cache', { error: err.message })
      }
      this.isConnected = false
    })

    this.client.on('connect', () => {
      logger.info('Redis Client Connected')
      this.isConnected = true
    })

    this.client.on('disconnect', () => {
      logger.warn('Redis Client Disconnected')
      this.isConnected = false
    })
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect()
      }
    } catch (error) {
      logger.warn('Failed to connect to Redis, continuing without cache', { error })
      // Don't throw error - allow app to work without cache
      // Don't retry automatically to avoid spam
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect()
      }
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error })
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        return null
      }

      const value = await this.client.get(key)
      if (!value) {
        return null
      }

      return JSON.parse(value) as T
    } catch (error) {
      logger.error('Cache get error', { key, error })
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      const serialized = JSON.stringify(value)
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized)
      } else {
        await this.client.set(key, serialized)
      }

      return true
    } catch (error) {
      logger.error('Cache set error', { key, error })
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      await this.client.del(key)
      return true
    } catch (error) {
      logger.error('Cache delete error', { key, error })
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Cache exists error', { key, error })
      return false
    }
  }

  async flush(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      await this.client.flushAll()
      return true
    } catch (error) {
      logger.error('Cache flush error', { error })
      return false
    }
  }

  // Cache with automatic key generation
  async cacheFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // Execute function and cache result
      const result = await fn()
      await this.set(key, result, ttlSeconds)
      
      return result
    } catch (error) {
      logger.error('Cache function error', { key, error })
      // If cache fails, just execute the function
      return await fn()
    }
  }

  // Generate cache keys
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false
      }

      await this.client.ping()
      return true
    } catch (error) {
      logger.error('Redis health check failed', { error })
      return false
    }
  }
}

// Singleton instance
export const cacheService = new CacheService()
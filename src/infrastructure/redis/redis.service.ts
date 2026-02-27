import Redis from 'ioredis';
import { injectable } from 'tsyringe';

import { getEnv } from '@config/env.js';

/**
 * Redis Service - ioredis wrapper
 */
@injectable()
export class RedisService {
  private client: Redis | null = null;

  public getClient(): Redis {
    if (this.client === null) {
      const env = getEnv();

      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number): number | null => {
          if (times > 3) {
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis connection error:', err.message);
      });
    }

    return this.client;
  }

  public async connect(): Promise<void> {
    await this.getClient().connect();
  }

  public async disconnect(): Promise<void> {
    if (this.client !== null) {
      await this.client.quit();
      this.client = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.getClient().ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // Convenience methods for common operations
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.getClient().setex(key, ttlSeconds, value);
    } else {
      await this.getClient().set(key, value);
    }
  }

  public async get(key: string): Promise<string | null> {
    return this.getClient().get(key);
  }

  public async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.getClient().exists(key);
    return result === 1;
  }

  public async sadd(key: string, ...members: string[]): Promise<void> {
    await this.getClient().sadd(key, ...members);
  }

  public async srem(key: string, ...members: string[]): Promise<void> {
    await this.getClient().srem(key, ...members);
  }

  public async smembers(key: string): Promise<string[]> {
    return this.getClient().smembers(key);
  }

  public async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.getClient().sismember(key, member);
    return result === 1;
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.getClient().expire(key, ttlSeconds);
  }
}

export const REDIS_SERVICE_TOKEN = Symbol('RedisService');

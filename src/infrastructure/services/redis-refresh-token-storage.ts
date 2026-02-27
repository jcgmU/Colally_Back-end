import { injectable, inject } from 'tsyringe';

import { parseTtlToSeconds, getEnv } from '@config/env.js';
import type { IRefreshTokenStorage } from '@domain/auth/ports/refresh-token-storage.port.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import { RedisService, REDIS_SERVICE_TOKEN } from '@infrastructure/redis/index.js';

/**
 * Redis Refresh Token Storage Implementation
 * Stores refresh tokens in Redis sets per user
 */
@injectable()
export class RedisRefreshTokenStorage implements IRefreshTokenStorage {
  constructor(
    @inject(REDIS_SERVICE_TOKEN)
    private readonly redis: RedisService
  ) {}

  private getKey(userId: UserId): string {
    return `refresh_tokens:${userId.value}`;
  }

  public async store(userId: UserId, refreshToken: string, ttlSeconds: number): Promise<void> {
    const key = this.getKey(userId);
    await this.redis.sadd(key, refreshToken);
    await this.redis.expire(key, ttlSeconds);
  }

  public async exists(userId: UserId, refreshToken: string): Promise<boolean> {
    const key = this.getKey(userId);
    return this.redis.sismember(key, refreshToken);
  }

  public async revoke(userId: UserId, refreshToken: string): Promise<void> {
    const key = this.getKey(userId);
    await this.redis.srem(key, refreshToken);
  }

  public async revokeAll(userId: UserId): Promise<void> {
    const key = this.getKey(userId);
    await this.redis.del(key);
  }

  public async getAll(userId: UserId): Promise<string[]> {
    const key = this.getKey(userId);
    return this.redis.smembers(key);
  }

  /**
   * Get the configured refresh token TTL in seconds
   */
  public getRefreshTokenTtl(): number {
    const env = getEnv();
    return parseTtlToSeconds(env.JWT_REFRESH_TOKEN_TTL);
  }
}

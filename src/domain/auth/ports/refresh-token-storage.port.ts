import { UserId } from '../value-objects/index.js';

/**
 * Refresh Token Storage Port
 * Defines the interface for storing refresh tokens in Redis
 */
export interface IRefreshTokenStorage {
  /**
   * Store a refresh token for a user
   */
  store(userId: UserId, refreshToken: string, ttlSeconds: number): Promise<void>;

  /**
   * Check if a refresh token exists and is valid for a user
   */
  exists(userId: UserId, refreshToken: string): Promise<boolean>;

  /**
   * Revoke (delete) a specific refresh token
   */
  revoke(userId: UserId, refreshToken: string): Promise<void>;

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  revokeAll(userId: UserId): Promise<void>;

  /**
   * Get all active refresh tokens for a user
   */
  getAll(userId: UserId): Promise<string[]>;
}

export const REFRESH_TOKEN_STORAGE_TOKEN = Symbol('IRefreshTokenStorage');

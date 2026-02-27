import { UserId } from '../value-objects/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token Service Port
 * Defines the interface for JWT token operations
 */
export interface ITokenService {
  /**
   * Generate an access token
   */
  generateAccessToken(userId: UserId, email: string): string;

  /**
   * Generate a refresh token
   */
  generateRefreshToken(userId: UserId, email: string): string;

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(userId: UserId, email: string): TokenPair;

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): TokenPayload;

  /**
   * Verify and decode a refresh token
   */
  verifyRefreshToken(token: string): TokenPayload;
}

export const TOKEN_SERVICE_TOKEN = Symbol('ITokenService');

import { describe, it, expect, beforeEach } from 'vitest';

import { JwtTokenService } from './jwt-token-service.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import { InvalidTokenError, TokenExpiredError } from '@domain/auth/errors/index.js';

describe('JwtTokenService', () => {
  let service: JwtTokenService;

  const testUserId = UserId.create('550e8400-e29b-41d4-a716-446655440000');
  const testEmail = 'user@example.com';

  beforeEach(() => {
    service = new JwtTokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      // Act
      const token = service.generateAccessToken(testUserId, testEmail);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token that can be verified', () => {
      // Act
      const token = service.generateAccessToken(testUserId, testEmail);
      const payload = service.verifyAccessToken(token);

      // Assert
      expect(payload.userId).toBe(testUserId.value);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      // Act
      const token = service.generateRefreshToken(testUserId, testEmail);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate token that can be verified', () => {
      // Act
      const token = service.generateRefreshToken(testUserId, testEmail);
      const payload = service.verifyRefreshToken(token);

      // Assert
      expect(payload.userId).toBe(testUserId.value);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      // Act
      const tokens = service.generateTokenPair(testUserId, testEmail);

      // Assert
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate tokens with correct types', () => {
      // Act
      const tokens = service.generateTokenPair(testUserId, testEmail);
      const accessPayload = service.verifyAccessToken(tokens.accessToken);
      const refreshPayload = service.verifyRefreshToken(tokens.refreshToken);

      // Assert
      expect(accessPayload.type).toBe('access');
      expect(refreshPayload.type).toBe('refresh');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      // Arrange
      const token = service.generateAccessToken(testUserId, testEmail);

      // Act
      const payload = service.verifyAccessToken(token);

      // Assert
      expect(payload.userId).toBe(testUserId.value);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('access');
    });

    it('should throw InvalidTokenError for invalid token', () => {
      // Act & Assert
      expect(() => service.verifyAccessToken('invalid-token')).toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError when using refresh token as access token', () => {
      // Arrange
      const refreshToken = service.generateRefreshToken(testUserId, testEmail);

      // Act & Assert
      expect(() => service.verifyAccessToken(refreshToken)).toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError for malformed token', () => {
      // Act & Assert
      expect(() => service.verifyAccessToken('not.a.valid.jwt')).toThrow(InvalidTokenError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      // Arrange
      const token = service.generateRefreshToken(testUserId, testEmail);

      // Act
      const payload = service.verifyRefreshToken(token);

      // Assert
      expect(payload.userId).toBe(testUserId.value);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('refresh');
    });

    it('should throw InvalidTokenError for invalid token', () => {
      // Act & Assert
      expect(() => service.verifyRefreshToken('invalid-token')).toThrow(InvalidTokenError);
    });

    it('should throw InvalidTokenError when using access token as refresh token', () => {
      // Arrange
      const accessToken = service.generateAccessToken(testUserId, testEmail);

      // Act & Assert
      expect(() => service.verifyRefreshToken(accessToken)).toThrow(InvalidTokenError);
    });
  });

  describe('token consistency', () => {
    it('should include same user info in all tokens from a pair', () => {
      // Arrange
      const tokens = service.generateTokenPair(testUserId, testEmail);

      // Act
      const accessPayload = service.verifyAccessToken(tokens.accessToken);
      const refreshPayload = service.verifyRefreshToken(tokens.refreshToken);

      // Assert
      expect(accessPayload.userId).toBe(refreshPayload.userId);
      expect(accessPayload.email).toBe(refreshPayload.email);
    });
  });
});

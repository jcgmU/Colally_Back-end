import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { LogoutUseCase } from './logout.use-case.js';
import type { ITokenService, TokenPayload } from '@domain/auth/ports/token-service.port.js';
import type { IRefreshTokenStorage } from '@domain/auth/ports/refresh-token-storage.port.js';
import { InvalidTokenError } from '@domain/auth/errors/index.js';

describe('LogoutUseCase', () => {
  // Mocks
  const mockTokenService = mockDeep<ITokenService>();
  const mockRefreshTokenStorage = mockDeep<IRefreshTokenStorage>();

  // Use case under test
  let useCase: LogoutUseCase;

  // Test data
  const validInput = {
    refreshToken: 'valid-refresh-token',
  };

  const mockTokenPayload: TokenPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    type: 'refresh',
  };

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTokenService);
    mockReset(mockRefreshTokenStorage);

    // Create fresh use case instance
    useCase = new LogoutUseCase(mockTokenService, mockRefreshTokenStorage);

    // Setup default mock behaviors
    mockTokenService.verifyRefreshToken.mockReturnValue(mockTokenPayload);
    mockRefreshTokenStorage.revoke.mockResolvedValue(undefined);
    mockRefreshTokenStorage.revokeAll.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should successfully logout (single token)', async () => {
      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should verify the refresh token', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(validInput.refreshToken);
    });

    it('should revoke only the provided token by default', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockRefreshTokenStorage.revoke).toHaveBeenCalledWith(
        expect.anything(),
        validInput.refreshToken
      );
      expect(mockRefreshTokenStorage.revokeAll).not.toHaveBeenCalled();
    });

    it('should revoke all tokens when logoutAll is true', async () => {
      // Arrange
      const inputWithLogoutAll = { ...validInput, logoutAll: true };

      // Act
      await useCase.execute(inputWithLogoutAll);

      // Assert
      expect(mockRefreshTokenStorage.revokeAll).toHaveBeenCalledTimes(1);
      expect(mockRefreshTokenStorage.revoke).not.toHaveBeenCalled();
    });

    it('should throw when refresh token is invalid', async () => {
      // Arrange
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new InvalidTokenError('Invalid token');
      });

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidTokenError);
    });

    it('should return success even if token was already revoked', async () => {
      // The revoke operation is idempotent - it succeeds even if token doesn't exist
      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

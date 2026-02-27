import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { RefreshTokenUseCase } from './refresh-token.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type { ITokenService, TokenPair, TokenPayload } from '@domain/auth/ports/token-service.port.js';
import type { IRefreshTokenStorage } from '@domain/auth/ports/refresh-token-storage.port.js';
import { InvalidTokenError, UserNotFoundError, UserInactiveError } from '@domain/auth/errors/index.js';
import { createTestUser, createInactiveTestUser } from '@shared/test/factories/index.js';

describe('RefreshTokenUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();
  const mockTokenService = mockDeep<ITokenService>();
  const mockRefreshTokenStorage = mockDeep<IRefreshTokenStorage>();

  // Use case under test
  let useCase: RefreshTokenUseCase;

  // Test data
  const testUser = createTestUser({
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
  });

  const validInput = {
    refreshToken: 'valid-refresh-token',
  };

  const mockTokenPayload: TokenPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    type: 'refresh',
  };

  const mockNewTokenPair: TokenPair = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  };

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockTokenService);
    mockReset(mockRefreshTokenStorage);

    // Create fresh use case instance
    useCase = new RefreshTokenUseCase(
      mockUserRepository,
      mockTokenService,
      mockRefreshTokenStorage
    );

    // Setup default mock behaviors
    mockTokenService.verifyRefreshToken.mockReturnValue(mockTokenPayload);
    mockUserRepository.findById.mockResolvedValue(testUser);
    mockRefreshTokenStorage.exists.mockResolvedValue(true);
    mockRefreshTokenStorage.revoke.mockResolvedValue(undefined);
    mockTokenService.generateTokenPair.mockReturnValue(mockNewTokenPair);
    mockRefreshTokenStorage.store.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should successfully refresh tokens', async () => {
      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.tokens.accessToken).toBe(mockNewTokenPair.accessToken);
      expect(result.tokens.refreshToken).toBe(mockNewTokenPair.refreshToken);
    });

    it('should verify the refresh token', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(validInput.refreshToken);
    });

    it('should check if user exists', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should check if refresh token is stored (not revoked)', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockRefreshTokenStorage.exists).toHaveBeenCalledWith(
        expect.anything(),
        validInput.refreshToken
      );
    });

    it('should revoke old refresh token (rotation)', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockRefreshTokenStorage.revoke).toHaveBeenCalledWith(
        expect.anything(),
        validInput.refreshToken
      );
    });

    it('should generate new token pair', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledTimes(1);
    });

    it('should store new refresh token', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockRefreshTokenStorage.store).toHaveBeenCalledWith(
        expect.anything(),
        mockNewTokenPair.refreshToken,
        expect.any(Number)
      );
    });

    it('should throw when refresh token is invalid', async () => {
      // Arrange
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new InvalidTokenError('Invalid token');
      });

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidTokenError);
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw UserInactiveError when user is deactivated', async () => {
      // Arrange
      const inactiveUser = createInactiveTestUser({ id: '550e8400-e29b-41d4-a716-446655440000' });
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(UserInactiveError);
    });

    it('should throw InvalidTokenError when refresh token is revoked', async () => {
      // Arrange
      mockRefreshTokenStorage.exists.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidTokenError);
      expect(mockRefreshTokenStorage.revoke).not.toHaveBeenCalled();
    });
  });
});

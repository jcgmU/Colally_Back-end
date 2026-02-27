import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { LoginUserUseCase } from './login-user.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type { IPasswordHasher } from '@domain/auth/ports/password-hasher.port.js';
import type { ITokenService, TokenPair } from '@domain/auth/ports/token-service.port.js';
import type { IRefreshTokenStorage } from '@domain/auth/ports/refresh-token-storage.port.js';
import { InvalidCredentialsError, UserInactiveError } from '@domain/auth/errors/index.js';
import {
  createTestUser,
  createInactiveTestUser,
  VALID_TEST_PASSWORD,
} from '@shared/test/factories/index.js';

describe('LoginUserUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();
  const mockPasswordHasher = mockDeep<IPasswordHasher>();
  const mockTokenService = mockDeep<ITokenService>();
  const mockRefreshTokenStorage = mockDeep<IRefreshTokenStorage>();

  // Use case under test
  let useCase: LoginUserUseCase;

  // Test data
  const testUser = createTestUser({
    email: 'user@example.com',
    name: 'Test User',
  });

  const validInput = {
    email: 'user@example.com',
    password: VALID_TEST_PASSWORD,
  };

  const mockTokenPair: TokenPair = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockPasswordHasher);
    mockReset(mockTokenService);
    mockReset(mockRefreshTokenStorage);

    // Create fresh use case instance
    useCase = new LoginUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService,
      mockRefreshTokenStorage
    );

    // Setup default mock behaviors for successful login
    mockUserRepository.findByEmail.mockResolvedValue(testUser);
    mockPasswordHasher.verify.mockResolvedValue(true);
    mockTokenService.generateTokenPair.mockReturnValue(mockTokenPair);
    mockRefreshTokenStorage.store.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should successfully login a user with valid credentials', async () => {
      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validInput.email);
      expect(result.tokens.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.tokens.refreshToken).toBe(mockTokenPair.refreshToken);
    });

    it('should find user by email', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: validInput.email })
      );
    });

    it('should verify password against stored hash', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockPasswordHasher.verify).toHaveBeenCalledTimes(1);
    });

    it('should generate token pair on successful login', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledTimes(1);
    });

    it('should store refresh token', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockRefreshTokenStorage.store).toHaveBeenCalledTimes(1);
      expect(mockRefreshTokenStorage.store).toHaveBeenCalledWith(
        expect.anything(), // UserId
        mockTokenPair.refreshToken,
        expect.any(Number) // TTL
      );
    });

    it('should throw InvalidCredentialsError when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError);
      expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError when password is wrong', async () => {
      // Arrange
      mockPasswordHasher.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError);
      expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should throw UserInactiveError when user is deactivated', async () => {
      // Arrange
      const inactiveUser = createInactiveTestUser({ email: 'user@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(UserInactiveError);
      expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid email format', async () => {
      // Arrange
      const invalidInput = { ...validInput, email: 'not-an-email' };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should normalize email to lowercase before lookup', async () => {
      // Arrange
      const inputWithUppercaseEmail = { ...validInput, email: 'USER@EXAMPLE.COM' };

      // Act
      await useCase.execute(inputWithUppercaseEmail);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'user@example.com' })
      );
    });

    it('should return user data without password', async () => {
      // Act
      const result = await useCase.execute(validInput);

      // Assert - user output should not contain password
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(result.user.name).toBeDefined();
    });
  });
});

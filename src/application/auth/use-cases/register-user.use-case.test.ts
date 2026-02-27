import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { RegisterUserUseCase } from './register-user.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type { IPasswordHasher } from '@domain/auth/ports/password-hasher.port.js';
import type { ITokenService, TokenPair } from '@domain/auth/ports/token-service.port.js';
import type { IRefreshTokenStorage } from '@domain/auth/ports/refresh-token-storage.port.js';
import { HashedPassword } from '@domain/auth/value-objects/index.js';
import { UserAlreadyExistsError } from '@domain/auth/errors/index.js';
import { VALID_TEST_PASSWORD } from '@shared/test/factories/index.js';

describe('RegisterUserUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();
  const mockPasswordHasher = mockDeep<IPasswordHasher>();
  const mockTokenService = mockDeep<ITokenService>();
  const mockRefreshTokenStorage = mockDeep<IRefreshTokenStorage>();

  // Use case under test
  let useCase: RegisterUserUseCase;

  // Test data
  const validInput = {
    email: 'newuser@example.com',
    password: VALID_TEST_PASSWORD,
    name: 'New User',
  };

  const mockTokenPair: TokenPair = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockHashedPassword = HashedPassword.fromHash('$2b$12$hashedpassword');

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockPasswordHasher);
    mockReset(mockTokenService);
    mockReset(mockRefreshTokenStorage);

    // Create fresh use case instance
    useCase = new RegisterUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService,
      mockRefreshTokenStorage
    );

    // Setup default mock behaviors
    mockUserRepository.existsByEmail.mockResolvedValue(false);
    mockPasswordHasher.hash.mockResolvedValue(mockHashedPassword);
    mockTokenService.generateTokenPair.mockReturnValue(mockTokenPair);
    mockRefreshTokenStorage.store.mockResolvedValue(undefined);
    mockUserRepository.save.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should successfully register a new user', async () => {
      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validInput.email);
      expect(result.user.name).toBe(validInput.name);
      expect(result.user.isActive).toBe(true);
      expect(result.tokens.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.tokens.refreshToken).toBe(mockTokenPair.refreshToken);
    });

    it('should check if email already exists', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: validInput.email })
      );
    });

    it('should hash the password before saving', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockPasswordHasher.hash).toHaveBeenCalledTimes(1);
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(
        expect.objectContaining({ value: validInput.password })
      );
    });

    it('should save the user to the repository', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.objectContaining({ value: validInput.email }),
          name: validInput.name,
        })
      );
    });

    it('should generate token pair for the new user', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockTokenService.generateTokenPair).toHaveBeenCalledTimes(1);
    });

    it('should store refresh token in storage', async () => {
      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockRefreshTokenStorage.store).toHaveBeenCalledTimes(1);
      expect(mockRefreshTokenStorage.store).toHaveBeenCalledWith(
        expect.anything(), // UserId
        mockTokenPair.refreshToken,
        expect.any(Number) // TTL in seconds
      );
    });

    it('should throw UserAlreadyExistsError when email is taken', async () => {
      // Arrange
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await expect(useCase.execute(validInput)).rejects.toThrow(UserAlreadyExistsError);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid email format', async () => {
      // Arrange
      const invalidInput = { ...validInput, email: 'invalid-email' };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for weak password', async () => {
      // Arrange
      const invalidInput = { ...validInput, password: 'weak' };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for empty name', async () => {
      // Arrange
      const invalidInput = { ...validInput, name: '' };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should trim whitespace from name', async () => {
      // Arrange
      const inputWithWhitespace = { ...validInput, name: '  Trimmed Name  ' };

      // Act
      const result = await useCase.execute(inputWithWhitespace);

      // Assert
      expect(result.user.name).toBe('Trimmed Name');
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const inputWithUppercaseEmail = { ...validInput, email: 'USER@EXAMPLE.COM' };

      // Act
      const result = await useCase.execute(inputWithUppercaseEmail);

      // Assert
      expect(result.user.email).toBe('user@example.com');
    });
  });
});

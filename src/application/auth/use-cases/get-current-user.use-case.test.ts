import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import { UserNotFoundError, InvalidUserIdError } from '@domain/auth/errors/index.js';
import { createTestUser } from '@shared/test/factories/index.js';

describe('GetCurrentUserUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();

  // Use case under test
  let useCase: GetCurrentUserUseCase;

  // Test data
  const testUser = createTestUser({
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    name: 'Test User',
  });

  const validUserId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);

    // Create fresh use case instance
    useCase = new GetCurrentUserUseCase(mockUserRepository);

    // Setup default mock behaviors
    mockUserRepository.findById.mockResolvedValue(testUser);
  });

  describe('execute', () => {
    it('should return user data for valid user ID', async () => {
      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(validUserId);
      expect(result.user.email).toBe('user@example.com');
      expect(result.user.name).toBe('Test User');
    });

    it('should find user by ID', async () => {
      // Act
      await useCase.execute(validUserId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: validUserId })
      );
    });

    it('should return user output without password', async () => {
      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(result.user.name).toBeDefined();
      expect(result.user.isActive).toBeDefined();
      expect(result.user.createdAt).toBeDefined();
      expect(result.user.updatedAt).toBeDefined();
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validUserId)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw InvalidUserIdError for invalid UUID format', async () => {
      // Arrange
      const invalidUserId = 'not-a-valid-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId)).rejects.toThrow(InvalidUserIdError);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should include isActive status in response', async () => {
      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.user.isActive).toBe(true);
    });

    it('should include timestamps in response', async () => {
      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.user.createdAt).toBeInstanceOf(Date);
      expect(result.user.updatedAt).toBeInstanceOf(Date);
    });
  });
});

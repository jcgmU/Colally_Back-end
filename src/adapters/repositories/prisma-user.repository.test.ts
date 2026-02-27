import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient, User as PrismaUser } from '@prisma/client';

import { PrismaUserRepository } from './prisma-user.repository.js';
import { DatabaseService } from '@infrastructure/database/database.service.js';
import { Email, UserId } from '@domain/auth/value-objects/index.js';
import { createTestUser } from '@shared/test/factories/index.js';

describe('PrismaUserRepository', () => {
  // Mocks
  const mockPrismaClient = mockDeep<PrismaClient>();
  const mockDatabaseService = mockDeep<DatabaseService>();

  // Repository under test
  let repository: PrismaUserRepository;

  // Test data
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testEmail = 'user@example.com';

  const prismaMockUser: PrismaUser = {
    id: testUserId,
    email: testEmail,
    password: '$2b$12$hashedpassword',
    name: 'Test User',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    passwordResetToken: null,
    passwordResetExpires: null,
  };

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockPrismaClient);
    mockReset(mockDatabaseService);

    // Setup database service to return mock prisma client
    mockDatabaseService.getClient.mockReturnValue(mockPrismaClient as unknown as PrismaClient);

    // Create fresh repository instance
    repository = new PrismaUserRepository(mockDatabaseService);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(prismaMockUser);
      const userId = UserId.create(testUserId);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id.value).toBe(testUserId);
      expect(result?.email.value).toBe(testEmail);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      const userId = UserId.create(testUserId);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should call prisma with correct where clause', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      const userId = UserId.create(testUserId);

      // Act
      await repository.findById(userId);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUserId },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(prismaMockUser);
      const email = Email.create(testEmail);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.email.value).toBe(testEmail);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      const email = Email.create(testEmail);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });

    it('should call prisma with correct where clause', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      const email = Email.create(testEmail);

      // Act
      await repository.findByEmail(email);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user exists', async () => {
      // Arrange
      mockPrismaClient.user.count.mockResolvedValue(1);
      const email = Email.create(testEmail);

      // Act
      const result = await repository.existsByEmail(email);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      mockPrismaClient.user.count.mockResolvedValue(0);
      const email = Email.create(testEmail);

      // Act
      const result = await repository.existsByEmail(email);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    it('should upsert user data', async () => {
      // Arrange
      const user = createTestUser({
        id: testUserId,
        email: testEmail,
        name: 'Test User',
      });
      mockPrismaClient.user.upsert.mockResolvedValue(prismaMockUser);

      // Act
      await repository.save(user);

      // Assert
      expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testUserId },
          create: expect.objectContaining({
            id: testUserId,
            email: testEmail,
          }),
          update: expect.objectContaining({
            email: testEmail,
          }),
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      // Arrange
      const userId = UserId.create(testUserId);
      mockPrismaClient.user.delete.mockResolvedValue(prismaMockUser);

      // Act
      await repository.delete(userId);

      // Assert
      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: testUserId },
      });
    });
  });

  describe('findByPasswordResetToken', () => {
    it('should return user with valid reset token', async () => {
      // Arrange
      const userWithResetToken: PrismaUser = {
        ...prismaMockUser,
        passwordResetToken: 'valid-reset-token',
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
      };
      mockPrismaClient.user.findFirst.mockResolvedValue(userWithResetToken);

      // Act
      const result = await repository.findByPasswordResetToken('valid-reset-token');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.passwordResetToken).toBe('valid-reset-token');
    });

    it('should return null when token not found or expired', async () => {
      // Arrange
      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      // Act
      const result = await repository.findByPasswordResetToken('expired-token');

      // Assert
      expect(result).toBeNull();
    });
  });
});

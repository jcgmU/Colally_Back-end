import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { CreateProjectUseCase } from './create-project.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { ProjectNameInvalidError } from '@domain/project/errors/index.js';
import {
  NotTeamMemberError,
  InsufficientTeamPermissionError,
} from '@shared/auth/team-permission.helper.js';
import {
  createTestProject,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('CreateProjectUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: CreateProjectUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const validInput = {
    name: 'My New Project',
    description: 'A project for awesome things',
  };

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new CreateProjectUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors - user is an admin
    mockTeamRepository.getMembership.mockResolvedValue(
      createAdminMembership(userId, teamId)
    );
    mockProjectRepository.getNextPosition.mockResolvedValue(0);
    mockProjectRepository.save.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should create project successfully when user is admin', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(
        createAdminMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(userId, teamId, validInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(validInput.name);
      expect(result.description).toBe(validInput.description);
      expect(result.id).toBeDefined();
      expect(result.status).toBe('active');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create project successfully when user is owner', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(
        createOwnerMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(userId, teamId, validInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(validInput.name);
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is only member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(
        createMemberMembership(userId, teamId)
      );

      // Act & Assert
      await expect(useCase.execute(userId, teamId, validInput)).rejects.toThrow(
        InsufficientTeamPermissionError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when user is not team member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, teamId, validInput)).rejects.toThrow(
        NotTeamMemberError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw validation error for empty name', async () => {
      // Arrange
      const invalidInput = { name: '' };

      // Act & Assert
      await expect(useCase.execute(userId, teamId, invalidInput)).rejects.toThrow();
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw validation error for name too long', async () => {
      // Arrange
      const invalidInput = { name: 'a'.repeat(101) };

      // Act & Assert
      await expect(useCase.execute(userId, teamId, invalidInput)).rejects.toThrow();
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should assign next position automatically', async () => {
      // Arrange
      const expectedPosition = 5;
      mockProjectRepository.getNextPosition.mockResolvedValue(expectedPosition);

      // Act
      const result = await useCase.execute(userId, teamId, validInput);

      // Assert
      expect(result.position).toBe(expectedPosition);
      expect(mockProjectRepository.getNextPosition).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId })
      );
    });

    it('should allow creating project without description', async () => {
      // Arrange
      const inputWithoutDescription = { name: 'Project Without Description' };

      // Act
      const result = await useCase.execute(userId, teamId, inputWithoutDescription);

      // Assert
      expect(result.name).toBe(inputWithoutDescription.name);
      expect(result.description).toBeNull();
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should call repository.save with correct project data', async () => {
      // Act
      await useCase.execute(userId, teamId, validInput);

      // Assert
      expect(mockProjectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.objectContaining({ value: validInput.name }),
          teamId: expect.objectContaining({ value: teamId }),
        })
      );
    });

    it('should throw error for invalid userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId, teamId, validInput)).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Arrange
      const invalidTeamId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(userId, invalidTeamId, validInput)).rejects.toThrow();
    });

    it('should return project output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, teamId, validInput);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('teamId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('position');
      expect(result).toHaveProperty('createdBy');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should accept project with max valid name length', async () => {
      // Arrange
      const inputWithMaxName = { name: 'a'.repeat(100) };

      // Act
      const result = await useCase.execute(userId, teamId, inputWithMaxName);

      // Assert
      expect(result.name).toBe(inputWithMaxName.name);
    });
  });
});

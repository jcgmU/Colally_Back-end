import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { UpdateProjectUseCase } from './update-project.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import {
  ProjectNotFoundError,
  CannotUpdateArchivedProjectError,
} from '@domain/project/errors/index.js';
import {
  NotTeamMemberError,
  InsufficientTeamPermissionError,
} from '@shared/auth/team-permission.helper.js';
import {
  createTestProject,
  createArchivedTestProject,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
  PROJECT_TEST_IDS,
} from '@shared/test/factories/index.js';

describe('UpdateProjectUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: UpdateProjectUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const projectId = PROJECT_TEST_IDS.project1;
  const testProject = createTestProject({
    id: projectId,
    teamId,
    name: 'Original Name',
    description: 'Original Description',
  });

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new UpdateProjectUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors - user is an admin
    mockProjectRepository.findById.mockResolvedValue(testProject);
    mockTeamRepository.getMembership.mockResolvedValue(createAdminMembership(userId, teamId));
    mockProjectRepository.save.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should update project name successfully', async () => {
      // Arrange
      const updateInput = { name: 'Updated Project Name' };

      // Act
      const result = await useCase.execute(userId, projectId, updateInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Project Name');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update project description', async () => {
      // Arrange
      const updateInput = { description: 'Updated Description' };

      // Act
      const result = await useCase.execute(userId, projectId, updateInput);

      // Assert
      expect(result.description).toBe('Updated Description');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should allow clearing description (set to null)', async () => {
      // Arrange
      const updateInput = { description: null };

      // Act
      const result = await useCase.execute(userId, projectId, updateInput);

      // Assert
      expect(result.description).toBeNull();
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update both name and description at once', async () => {
      // Arrange
      const updateInput = {
        name: 'New Name',
        description: 'New Description',
      };

      // Act
      const result = await useCase.execute(userId, projectId, updateInput);

      // Assert
      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New Description');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ProjectNotFoundError when project does not exist', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, projectId, { name: 'New Name' })).rejects.toThrow(
        ProjectNotFoundError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when user is only member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(createMemberMembership(userId, teamId));

      // Act & Assert
      await expect(useCase.execute(userId, projectId, { name: 'New Name' })).rejects.toThrow(
        InsufficientTeamPermissionError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should allow owner to update project', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(createOwnerMembership(userId, teamId));
      const updateInput = { name: 'Owner Updated' };

      // Act
      const result = await useCase.execute(userId, projectId, updateInput);

      // Assert
      expect(result.name).toBe('Owner Updated');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw CannotUpdateArchivedProjectError when project is archived', async () => {
      // Arrange
      const archivedProject = createArchivedTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(archivedProject);

      // Act & Assert
      await expect(useCase.execute(userId, projectId, { name: 'New Name' })).rejects.toThrow(
        CannotUpdateArchivedProjectError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw validation error for empty name', async () => {
      // Arrange
      const invalidInput = { name: '' };

      // Act & Assert
      await expect(useCase.execute(userId, projectId, invalidInput)).rejects.toThrow();
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw validation error for name too long', async () => {
      // Arrange
      const invalidInput = { name: 'a'.repeat(101) };

      // Act & Assert
      await expect(useCase.execute(userId, projectId, invalidInput)).rejects.toThrow();
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should return current project when nothing to update', async () => {
      // Arrange
      const emptyInput = {};

      // Act
      const result = await useCase.execute(userId, projectId, emptyInput);

      // Assert
      expect(result.name).toBe('Original Name');
      expect(result.description).toBe('Original Description');
      // Should not call save when nothing changes
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotTeamMemberError when user is not team member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, projectId, { name: 'New Name' })).rejects.toThrow(
        NotTeamMemberError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should call repository.findById with correct project ID', async () => {
      // Act
      await useCase.execute(userId, projectId, { name: 'New Name' });

      // Assert
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: projectId })
      );
    });

    it('should throw error for invalid userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId, projectId, { name: 'New Name' })).rejects.toThrow();
    });

    it('should throw error for invalid projectId format', async () => {
      // Arrange
      const invalidProjectId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(userId, invalidProjectId, { name: 'New Name' })).rejects.toThrow();
    });

    it('should return project output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, projectId, { name: 'Updated' });

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
      const result = await useCase.execute(userId, projectId, inputWithMaxName);

      // Assert
      expect(result.name).toBe(inputWithMaxName.name);
    });
  });
});

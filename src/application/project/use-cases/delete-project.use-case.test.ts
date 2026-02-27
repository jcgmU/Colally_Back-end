import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { DeleteProjectUseCase } from './delete-project.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { ProjectNotFoundError } from '@domain/project/errors/index.js';
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
  PROJECT_TEST_IDS,
} from '@shared/test/factories/index.js';

describe('DeleteProjectUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: DeleteProjectUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const projectId = PROJECT_TEST_IDS.project1;

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new DeleteProjectUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors - project exists, user is owner
    const project = createTestProject({ id: projectId, teamId });
    mockProjectRepository.findById.mockResolvedValue(project);
    mockTeamRepository.getMembership.mockResolvedValue(
      createOwnerMembership(userId, teamId)
    );
    mockProjectRepository.delete.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should delete project successfully when user is owner', async () => {
      // Arrange
      const project = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(project);
      mockTeamRepository.getMembership.mockResolvedValue(
        createOwnerMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(projectId, userId);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockProjectRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw InsufficientTeamPermissionError when user is admin (not owner)', async () => {
      // Arrange
      const project = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(project);
      mockTeamRepository.getMembership.mockResolvedValue(
        createAdminMembership(userId, teamId)
      );

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        InsufficientTeamPermissionError
      );
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InsufficientTeamPermissionError when user is member', async () => {
      // Arrange
      const project = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(project);
      mockTeamRepository.getMembership.mockResolvedValue(
        createMemberMembership(userId, teamId)
      );

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        InsufficientTeamPermissionError
      );
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ProjectNotFoundError when project does not exist', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        ProjectNotFoundError
      );
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotTeamMemberError when user is not team member', async () => {
      // Arrange
      const project = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(project);
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        NotTeamMemberError
      );
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });
  });
});

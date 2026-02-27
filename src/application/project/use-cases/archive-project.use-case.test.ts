import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { ArchiveProjectUseCase } from './archive-project.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import {
  ProjectNotFoundError,
  ProjectAlreadyArchivedError,
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

describe('ArchiveProjectUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: ArchiveProjectUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const projectId = PROJECT_TEST_IDS.project1;

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new ArchiveProjectUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors - active project exists, user is admin
    const activeProject = createTestProject({ id: projectId, teamId });
    mockProjectRepository.findById.mockResolvedValue(activeProject);
    mockTeamRepository.getMembership.mockResolvedValue(
      createAdminMembership(userId, teamId)
    );
    mockProjectRepository.save.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should archive project successfully when user is admin', async () => {
      // Arrange
      const activeProject = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(activeProject);
      mockTeamRepository.getMembership.mockResolvedValue(
        createAdminMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(projectId, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(projectId);
      expect(result.status).toBe('archived');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should archive project successfully when user is owner', async () => {
      // Arrange
      const activeProject = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(activeProject);
      mockTeamRepository.getMembership.mockResolvedValue(
        createOwnerMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(projectId, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('archived');
      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is only member', async () => {
      // Arrange
      const activeProject = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(activeProject);
      mockTeamRepository.getMembership.mockResolvedValue(
        createMemberMembership(userId, teamId)
      );

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        InsufficientTeamPermissionError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ProjectNotFoundError when project does not exist', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        ProjectNotFoundError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ProjectAlreadyArchivedError when project is already archived', async () => {
      // Arrange
      const archivedProject = createArchivedTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(archivedProject);
      mockTeamRepository.getMembership.mockResolvedValue(
        createAdminMembership(userId, teamId)
      );

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        ProjectAlreadyArchivedError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotTeamMemberError when user is not team member', async () => {
      // Arrange
      const activeProject = createTestProject({ id: projectId, teamId });
      mockProjectRepository.findById.mockResolvedValue(activeProject);
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(projectId, userId)).rejects.toThrow(
        NotTeamMemberError
      );
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });
  });
});

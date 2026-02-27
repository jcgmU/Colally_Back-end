import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { ReorderProjectsUseCase } from './reorder-projects.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { ReorderProjectsInvalidError } from '@domain/project/errors/index.js';
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

describe('ReorderProjectsUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: ReorderProjectsUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const projectId1 = PROJECT_TEST_IDS.project1;
  const projectId2 = PROJECT_TEST_IDS.project2;
  const projectId3 = PROJECT_TEST_IDS.project3;

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new ReorderProjectsUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors - 3 active projects exist, user is admin
    const projects = [
      createTestProject({ id: projectId1, teamId, position: 0 }),
      createTestProject({ id: projectId2, teamId, position: 1 }),
      createTestProject({ id: projectId3, teamId, position: 2 }),
    ];
    mockProjectRepository.findByTeamId.mockResolvedValue(projects);
    mockTeamRepository.getMembership.mockResolvedValue(
      createAdminMembership(userId, teamId)
    );
    mockProjectRepository.updatePositions.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should reorder projects successfully when user is admin', async () => {
      // Arrange
      const input = { projectIds: [projectId3, projectId1, projectId2] };
      mockTeamRepository.getMembership.mockResolvedValue(
        createAdminMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(teamId, input, userId);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockProjectRepository.updatePositions).toHaveBeenCalledTimes(1);
    });

    it('should reorder projects successfully when user is owner', async () => {
      // Arrange
      const input = { projectIds: [projectId2, projectId3, projectId1] };
      mockTeamRepository.getMembership.mockResolvedValue(
        createOwnerMembership(userId, teamId)
      );

      // Act
      const result = await useCase.execute(teamId, input, userId);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockProjectRepository.updatePositions).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is only member', async () => {
      // Arrange
      const input = { projectIds: [projectId1, projectId2, projectId3] };
      mockTeamRepository.getMembership.mockResolvedValue(
        createMemberMembership(userId, teamId)
      );

      // Act & Assert
      await expect(useCase.execute(teamId, input, userId)).rejects.toThrow(
        InsufficientTeamPermissionError
      );
      expect(mockProjectRepository.updatePositions).not.toHaveBeenCalled();
    });

    it('should throw error when projectIds is empty', async () => {
      // Arrange
      const input = { projectIds: [] as string[] };
      // Also need to mock empty projects for this team
      mockProjectRepository.findByTeamId.mockResolvedValue([]);

      // Act & Assert - Zod validation should fail for empty array
      await expect(useCase.execute(teamId, input, userId)).rejects.toThrow();
    });

    it('should throw ReorderProjectsInvalidError when missing project IDs', async () => {
      // Arrange - 3 projects exist but only 2 provided
      const input = { projectIds: [projectId1, projectId2] };

      // Act & Assert
      await expect(useCase.execute(teamId, input, userId)).rejects.toThrow(
        ReorderProjectsInvalidError
      );
      expect(mockProjectRepository.updatePositions).not.toHaveBeenCalled();
    });

    it('should throw ReorderProjectsInvalidError when extra project IDs provided', async () => {
      // Arrange - 3 projects exist but 4 IDs provided (one doesn't exist)
      const extraProjectId = '550e8400-e29b-41d4-a716-446655440099';
      const input = { projectIds: [projectId1, projectId2, projectId3, extraProjectId] };

      // Act & Assert
      await expect(useCase.execute(teamId, input, userId)).rejects.toThrow(
        ReorderProjectsInvalidError
      );
      expect(mockProjectRepository.updatePositions).not.toHaveBeenCalled();
    });

    it('should throw NotTeamMemberError when user is not team member', async () => {
      // Arrange
      const input = { projectIds: [projectId1, projectId2, projectId3] };
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(teamId, input, userId)).rejects.toThrow(
        NotTeamMemberError
      );
      expect(mockProjectRepository.updatePositions).not.toHaveBeenCalled();
    });

    it('should update positions based on array order', async () => {
      // Arrange - reorder: project3 first, project1 second, project2 third
      const input = { projectIds: [projectId3, projectId1, projectId2] };

      // Act
      await useCase.execute(teamId, input, userId);

      // Assert - verify updatePositions called with correct order
      expect(mockProjectRepository.updatePositions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ position: 0 }),
          expect.objectContaining({ position: 1 }),
          expect.objectContaining({ position: 2 }),
        ])
      );
    });
  });
});

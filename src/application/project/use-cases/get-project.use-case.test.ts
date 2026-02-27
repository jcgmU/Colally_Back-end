import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetProjectUseCase } from './get-project.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { ProjectNotFoundError } from '@domain/project/errors/index.js';
import { NotTeamMemberError } from '@shared/auth/team-permission.helper.js';
import {
  createTestProject,
  createArchivedTestProject,
  createMemberMembership,
  TEST_IDS,
  PROJECT_TEST_IDS,
} from '@shared/test/factories/index.js';

describe('GetProjectUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: GetProjectUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const projectId = PROJECT_TEST_IDS.project1;
  const testProject = createTestProject({ id: projectId, teamId, name: 'Test Project' });
  const archivedProject = createArchivedTestProject({ id: projectId, teamId, name: 'Archived Project' });
  const memberMembership = createMemberMembership(userId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new GetProjectUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors
    mockProjectRepository.findById.mockResolvedValue(testProject);
    mockTeamRepository.getMembership.mockResolvedValue(memberMembership);
  });

  describe('execute', () => {
    it('should return project when user is member', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(testProject);
      mockTeamRepository.getMembership.mockResolvedValue(memberMembership);

      // Act
      const result = await useCase.execute(userId, projectId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(projectId);
      expect(result.name).toBe('Test Project');
      expect(result.status).toBe('active');
    });

    it('should return archived project when user is member', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(archivedProject);
      mockTeamRepository.getMembership.mockResolvedValue(memberMembership);

      // Act
      const result = await useCase.execute(userId, projectId);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Archived Project');
      expect(result.status).toBe('archived');
    });

    it('should throw ProjectNotFoundError when project does not exist', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, projectId)).rejects.toThrow(ProjectNotFoundError);
      expect(mockTeamRepository.getMembership).not.toHaveBeenCalled();
    });

    it('should throw NotTeamMemberError when user is not team member', async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(testProject);
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, projectId)).rejects.toThrow(NotTeamMemberError);
    });

    it('should call repository with correct project ID', async () => {
      // Act
      await useCase.execute(userId, projectId);

      // Assert
      expect(mockProjectRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: projectId })
      );
    });

    it('should check team membership with correct IDs', async () => {
      // Act
      await useCase.execute(userId, projectId);

      // Assert
      expect(mockTeamRepository.getMembership).toHaveBeenCalledTimes(1);
      expect(mockTeamRepository.getMembership).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        expect.objectContaining({ value: userId })
      );
    });

    it('should throw error for invalid userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId, projectId)).rejects.toThrow();
    });

    it('should throw error for invalid projectId format', async () => {
      // Arrange
      const invalidProjectId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(userId, invalidProjectId)).rejects.toThrow();
    });

    it('should return project output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, projectId);

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
  });
});

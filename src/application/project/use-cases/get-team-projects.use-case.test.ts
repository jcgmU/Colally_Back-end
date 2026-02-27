import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetTeamProjectsUseCase } from './get-team-projects.use-case.js';
import type { IProjectRepository } from '@domain/project/ports/project-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { NotTeamMemberError } from '@shared/auth/team-permission.helper.js';
import {
  createTestProject,
  createArchivedTestProject,
  createMemberMembership,
  TEST_IDS,
  PROJECT_TEST_IDS,
} from '@shared/test/factories/index.js';

describe('GetTeamProjectsUseCase', () => {
  // Mocks
  const mockProjectRepository = mockDeep<IProjectRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: GetTeamProjectsUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const memberMembership = createMemberMembership(userId, teamId);

  // Test projects
  const activeProject1 = createTestProject({
    id: PROJECT_TEST_IDS.project1,
    teamId,
    name: 'Active Project 1',
    position: 0,
  });
  const activeProject2 = createTestProject({
    id: PROJECT_TEST_IDS.project2,
    teamId,
    name: 'Active Project 2',
    position: 1,
  });
  const archivedProject = createArchivedTestProject({
    id: PROJECT_TEST_IDS.project3,
    teamId,
    name: 'Archived Project',
    position: 2,
  });

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockProjectRepository);
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new GetTeamProjectsUseCase(mockProjectRepository, mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.getMembership.mockResolvedValue(memberMembership);
    mockProjectRepository.findByTeamId.mockResolvedValue([activeProject1, activeProject2]);
  });

  describe('execute', () => {
    it('should return active projects only by default', async () => {
      // Arrange
      mockProjectRepository.findByTeamId.mockResolvedValue([activeProject1, activeProject2]);

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Active Project 1');
      expect(result[1].name).toBe('Active Project 2');
      expect(mockProjectRepository.findByTeamId).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        false
      );
    });

    it('should return all projects when includeArchived is true', async () => {
      // Arrange
      mockProjectRepository.findByTeamId.mockResolvedValue([
        activeProject1,
        activeProject2,
        archivedProject,
      ]);

      // Act
      const result = await useCase.execute(userId, teamId, { includeArchived: true });

      // Assert
      expect(result).toHaveLength(3);
      expect(mockProjectRepository.findByTeamId).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        true
      );
    });

    it('should return empty array when no projects exist', async () => {
      // Arrange
      mockProjectRepository.findByTeamId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should throw NotTeamMemberError when user is not member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(NotTeamMemberError);
      expect(mockProjectRepository.findByTeamId).not.toHaveBeenCalled();
    });

    it('should return projects ordered by position', async () => {
      // Arrange - Return projects in reverse order
      const projectAtPosition2 = createTestProject({
        id: PROJECT_TEST_IDS.project1,
        teamId,
        name: 'Project at position 2',
        position: 2,
      });
      const projectAtPosition0 = createTestProject({
        id: PROJECT_TEST_IDS.project2,
        teamId,
        name: 'Project at position 0',
        position: 0,
      });
      const projectAtPosition1 = createTestProject({
        id: PROJECT_TEST_IDS.project3,
        teamId,
        name: 'Project at position 1',
        position: 1,
      });

      // Simulate repository returning ordered by position
      mockProjectRepository.findByTeamId.mockResolvedValue([
        projectAtPosition0,
        projectAtPosition1,
        projectAtPosition2,
      ]);

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
      expect(result[2].position).toBe(2);
    });

    it('should call repository with correct team ID', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockProjectRepository.findByTeamId).toHaveBeenCalledTimes(1);
      expect(mockProjectRepository.findByTeamId).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        false
      );
    });

    it('should check team membership with correct IDs', async () => {
      // Act
      await useCase.execute(userId, teamId);

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
      await expect(useCase.execute(invalidUserId, teamId)).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Arrange
      const invalidTeamId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(userId, invalidTeamId)).rejects.toThrow();
    });

    it('should return project DTOs with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result).toHaveLength(2);
      const project = result[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('teamId');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('position');
      expect(project).toHaveProperty('createdBy');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
    });
  });
});

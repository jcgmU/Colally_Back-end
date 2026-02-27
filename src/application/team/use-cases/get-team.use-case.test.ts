import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetTeamUseCase } from './get-team.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { TeamNotFoundError, NotMemberError } from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createOwnerMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('GetTeamUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: GetTeamUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId, name: 'Test Team' });
  const ownerMembership = createOwnerMembership(userId, teamId);
  const memberMembership = createMemberMembership(userId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new GetTeamUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.countMembers.mockResolvedValue(5);
  });

  describe('execute', () => {
    it('should successfully get team details for a member', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.team).toBeDefined();
      expect(result.team.id).toBe(teamId);
      expect(result.team.name).toBe('Test Team');
      expect(result.role).toBe('owner');
      expect(result.memberCount).toBe(5);
    });

    it('should return correct role for owner', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: ownerMembership,
      });

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.role).toBe('owner');
    });

    it('should return correct role for member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.role).toBe('member');
    });

    it('should call repository with correct IDs', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalledTimes(1);
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        expect.objectContaining({ value: userId })
      );
    });

    it('should call countMembers with teamId', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockTeamRepository.countMembers).toHaveBeenCalledTimes(1);
      expect(mockTeamRepository.countMembers).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId })
      );
    });

    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(TeamNotFoundError);
      expect(mockTeamRepository.countMembers).not.toHaveBeenCalled();
    });

    it('should throw NotMemberError when user is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(NotMemberError);
      expect(mockTeamRepository.countMembers).not.toHaveBeenCalled();
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

    it('should return team output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.team).toHaveProperty('id');
      expect(result.team).toHaveProperty('name');
      expect(result.team).toHaveProperty('description');
      expect(result.team).toHaveProperty('createdAt');
      expect(result.team).toHaveProperty('updatedAt');
    });
  });
});

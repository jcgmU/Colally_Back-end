import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetMyTeamsUseCase } from './get-my-teams.use-case.js';
import type { ITeamRepository, TeamWithRole } from '@domain/team/ports/team-repository.port.js';
import { TeamRole } from '@domain/team/value-objects/index.js';
import { createTestTeam, createRandomTestTeam, TEST_IDS } from '@shared/test/factories/index.js';

describe('GetMyTeamsUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: GetMyTeamsUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const team1 = createTestTeam({ id: TEST_IDS.team1, name: 'Team Alpha' });
  const team2 = createTestTeam({ id: TEST_IDS.team2, name: 'Team Beta' });

  const teamsWithRoles: TeamWithRole[] = [
    { team: team1, role: TeamRole.create('owner') },
    { team: team2, role: TeamRole.create('member') },
  ];

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new GetMyTeamsUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.findByUserId.mockResolvedValue(teamsWithRoles);
  });

  describe('execute', () => {
    it('should successfully get all teams for a user', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.teams).toHaveLength(2);
    });

    it('should return teams with their roles', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.teams[0].team.name).toBe('Team Alpha');
      expect(result.teams[0].role).toBe('owner');
      expect(result.teams[1].team.name).toBe('Team Beta');
      expect(result.teams[1].role).toBe('member');
    });

    it('should call repository with correct userId', async () => {
      // Act
      await useCase.execute(userId);

      // Assert
      expect(mockTeamRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockTeamRepository.findByUserId).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId })
      );
    });

    it('should return empty array when user has no teams', async () => {
      // Arrange
      mockTeamRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.teams).toHaveLength(0);
      expect(result.teams).toEqual([]);
    });

    it('should return team output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      const teamOutput = result.teams[0].team;
      expect(teamOutput).toHaveProperty('id');
      expect(teamOutput).toHaveProperty('name');
      expect(teamOutput).toHaveProperty('description');
      expect(teamOutput).toHaveProperty('createdAt');
      expect(teamOutput).toHaveProperty('updatedAt');
    });

    it('should handle multiple teams with same role', async () => {
      // Arrange
      const team3 = createRandomTestTeam({ name: 'Team Gamma' });
      const allMemberTeams: TeamWithRole[] = [
        { team: team1, role: TeamRole.create('member') },
        { team: team2, role: TeamRole.create('member') },
        { team: team3, role: TeamRole.create('member') },
      ];
      mockTeamRepository.findByUserId.mockResolvedValue(allMemberTeams);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.teams).toHaveLength(3);
      expect(result.teams.every((t) => t.role === 'member')).toBe(true);
    });

    it('should throw error for invalid userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId)).rejects.toThrow();
    });

    it('should preserve team data integrity', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.teams[0].team.id).toBe(TEST_IDS.team1);
      expect(result.teams[1].team.id).toBe(TEST_IDS.team2);
    });
  });
});

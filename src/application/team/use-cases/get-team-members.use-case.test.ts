import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetTeamMembersUseCase } from './get-team-members.use-case.js';
import type {
  ITeamRepository,
  MembershipWithUser,
} from '@domain/team/ports/team-repository.port.js';
import { TeamNotFoundError, NotMemberError } from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('GetTeamMembersUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: GetTeamMembersUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId });
  const ownerMembership = createOwnerMembership(userId, teamId);

  const membershipsWithUser: MembershipWithUser[] = [
    {
      membership: createOwnerMembership(TEST_IDS.user1, teamId),
      userName: 'Owner User',
      userEmail: 'owner@example.com',
      userAvatarUrl: 'https://example.com/avatar1.jpg',
    },
    {
      membership: createAdminMembership(TEST_IDS.user2, teamId),
      userName: 'Admin User',
      userEmail: 'admin@example.com',
      userAvatarUrl: null,
    },
    {
      membership: createMemberMembership(TEST_IDS.user3, teamId),
      userName: 'Member User',
      userEmail: 'member@example.com',
      userAvatarUrl: 'https://example.com/avatar3.jpg',
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new GetTeamMembersUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.getMemberships.mockResolvedValue(membershipsWithUser);
  });

  describe('execute', () => {
    it('should successfully get all team members', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.members).toHaveLength(3);
    });

    it('should return members with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      const member = result.members[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('userName');
      expect(member).toHaveProperty('userEmail');
      expect(member).toHaveProperty('userAvatarUrl');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('joinedAt');
    });

    it('should return correct user data for each member', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.members[0].userName).toBe('Owner User');
      expect(result.members[0].userEmail).toBe('owner@example.com');
      expect(result.members[0].role).toBe('owner');
      expect(result.members[1].userName).toBe('Admin User');
      expect(result.members[1].role).toBe('admin');
      expect(result.members[2].userName).toBe('Member User');
      expect(result.members[2].role).toBe('member');
    });

    it('should handle null avatar URL', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      const adminMember = result.members.find((m) => m.role === 'admin');
      expect(adminMember?.userAvatarUrl).toBeNull();
    });

    it('should verify user is a member before fetching members', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalledBefore(
        mockTeamRepository.getMemberships
      );
    });

    it('should call repository with correct teamId', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockTeamRepository.getMemberships).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId })
      );
    });

    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(
        TeamNotFoundError
      );
      expect(mockTeamRepository.getMemberships).not.toHaveBeenCalled();
    });

    it('should throw NotMemberError when user is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(
        NotMemberError
      );
      expect(mockTeamRepository.getMemberships).not.toHaveBeenCalled();
    });

    it('should allow member to view team members', async () => {
      // Arrange
      const memberMembership = createMemberMembership(userId, teamId);
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.members).toHaveLength(3);
    });

    it('should throw error for invalid userId format', async () => {
      // Act & Assert
      await expect(useCase.execute('not-a-uuid', teamId)).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Act & Assert
      await expect(useCase.execute(userId, 'not-a-uuid')).rejects.toThrow();
    });

    it('should return empty array when team has only one member', async () => {
      // Arrange
      mockTeamRepository.getMemberships.mockResolvedValue([membershipsWithUser[0]]);

      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.members).toHaveLength(1);
    });
  });
});

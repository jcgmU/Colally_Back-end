import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetTeamInvitationsUseCase } from './get-team-invitations.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import type { ITeamInvitationRepository } from '@domain/team/ports/team-invitation-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createTestInvitation,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('GetTeamInvitationsUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();
  const mockInvitationRepository = mockDeep<ITeamInvitationRepository>();

  // Use case under test
  let useCase: GetTeamInvitationsUseCase;

  // Test data
  const ownerId = TEST_IDS.user1;
  const adminId = TEST_IDS.user2;
  const memberId = TEST_IDS.user3;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId });

  const ownerMembership = createOwnerMembership(ownerId, teamId);
  const adminMembership = createAdminMembership(adminId, teamId);
  const memberMembership = createMemberMembership(memberId, teamId);

  const testInvitations = [
    createTestInvitation({ id: TEST_IDS.invitation1, teamId, email: 'user1@example.com' }),
    createTestInvitation({ id: TEST_IDS.invitation2, teamId, email: 'user2@example.com', role: 'admin' }),
  ];

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);
    mockReset(mockInvitationRepository);

    // Create fresh use case instance
    useCase = new GetTeamInvitationsUseCase(mockTeamRepository, mockInvitationRepository);

    // Setup default mock behaviors (owner as actor)
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockInvitationRepository.findByTeam.mockResolvedValue(testInvitations);
  });

  describe('execute - owner viewing invitations', () => {
    it('should allow owner to view all team invitations', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId);

      // Assert
      expect(result.invitations).toHaveLength(2);
    });

    it('should return invitation data correctly', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId);

      // Assert
      expect(result.invitations[0].email).toBe('user1@example.com');
      expect(result.invitations[0].role).toBe('member');
      expect(result.invitations[1].email).toBe('user2@example.com');
      expect(result.invitations[1].role).toBe('admin');
    });

    it('should call repository with correct teamId', async () => {
      // Act
      await useCase.execute(ownerId, teamId);

      // Assert
      expect(mockInvitationRepository.findByTeam).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId })
      );
    });
  });

  describe('execute - admin viewing invitations', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
    });

    it('should allow admin to view all team invitations', async () => {
      // Act
      const result = await useCase.execute(adminId, teamId);

      // Assert
      expect(result.invitations).toHaveLength(2);
    });
  });

  describe('execute - member viewing invitations', () => {
    it('should throw InsufficientPermissionError when member tries to view invitations', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act & Assert
      await expect(useCase.execute(memberId, teamId)).rejects.toThrow(
        InsufficientPermissionError
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(ownerId, teamId)).rejects.toThrow(TeamNotFoundError);
    });

    it('should throw NotMemberError when actor is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(useCase.execute(ownerId, teamId)).rejects.toThrow(NotMemberError);
    });

    it('should throw error for invalid userId format', async () => {
      // Act & Assert
      await expect(useCase.execute('not-a-uuid', teamId)).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Act & Assert
      await expect(useCase.execute(ownerId, 'not-a-uuid')).rejects.toThrow();
    });
  });

  describe('execute - empty results', () => {
    it('should return empty array when no invitations exist', async () => {
      // Arrange
      mockInvitationRepository.findByTeam.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(ownerId, teamId);

      // Assert
      expect(result.invitations).toHaveLength(0);
      expect(result.invitations).toEqual([]);
    });
  });

  describe('execute - output format', () => {
    it('should return invitation output with all required fields', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId);

      // Assert
      const invitation = result.invitations[0];
      expect(invitation).toHaveProperty('id');
      expect(invitation).toHaveProperty('teamId');
      expect(invitation).toHaveProperty('email');
      expect(invitation).toHaveProperty('role');
      expect(invitation).toHaveProperty('status');
      expect(invitation).toHaveProperty('invitedBy');
      expect(invitation).toHaveProperty('expiresAt');
      expect(invitation).toHaveProperty('createdAt');
    });
  });
});

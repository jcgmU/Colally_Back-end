import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { CancelInvitationUseCase } from './cancel-invitation.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import type { ITeamInvitationRepository } from '@domain/team/ports/team-invitation-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  InvitationNotFoundError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createTestInvitation,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('CancelInvitationUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();
  const mockInvitationRepository = mockDeep<ITeamInvitationRepository>();

  // Use case under test
  let useCase: CancelInvitationUseCase;

  // Test data
  const ownerId = TEST_IDS.user1;
  const adminId = TEST_IDS.user2;
  const memberId = TEST_IDS.user3;
  const teamId = TEST_IDS.team1;
  const invitationId = TEST_IDS.invitation1;

  const testTeam = createTestTeam({ id: teamId });
  const testInvitation = createTestInvitation({
    id: invitationId,
    teamId,
    email: 'invitee@example.com',
    status: 'pending',
  });

  const ownerMembership = createOwnerMembership(ownerId, teamId);
  const adminMembership = createAdminMembership(adminId, teamId);
  const memberMembership = createMemberMembership(memberId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);
    mockReset(mockInvitationRepository);

    // Create fresh use case instance
    useCase = new CancelInvitationUseCase(mockTeamRepository, mockInvitationRepository);

    // Setup default mock behaviors (owner as actor)
    mockInvitationRepository.findById.mockResolvedValue(testInvitation);
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockInvitationRepository.delete.mockResolvedValue(undefined);
  });

  describe('execute - owner canceling invitation', () => {
    it('should allow owner to cancel invitation', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, invitationId);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should delete the invitation', async () => {
      // Act
      await useCase.execute(ownerId, teamId, invitationId);

      // Assert
      expect(mockInvitationRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: invitationId })
      );
    });
  });

  describe('execute - admin canceling invitation', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
    });

    it('should allow admin to cancel invitation', async () => {
      // Act
      const result = await useCase.execute(adminId, teamId, invitationId);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('execute - member canceling invitation', () => {
    it('should throw InsufficientPermissionError when member tries to cancel', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act & Assert
      await expect(
        useCase.execute(memberId, teamId, invitationId)
      ).rejects.toThrow(InsufficientPermissionError);
      expect(mockInvitationRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('execute - error cases', () => {
    it('should throw InvitationNotFoundError when invitation does not exist', async () => {
      // Arrange
      mockInvitationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, invitationId)
      ).rejects.toThrow(InvitationNotFoundError);
    });

    it('should throw InvitationNotFoundError when invitation belongs to different team', async () => {
      // Arrange
      const differentTeamInvitation = createTestInvitation({
        id: invitationId,
        teamId: TEST_IDS.team2, // Different team
        email: 'invitee@example.com',
        status: 'pending',
      });
      mockInvitationRepository.findById.mockResolvedValue(differentTeamInvitation);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, invitationId)
      ).rejects.toThrow(InvitationNotFoundError);
    });

    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, invitationId)
      ).rejects.toThrow(TeamNotFoundError);
    });

    it('should throw NotMemberError when actor is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, invitationId)
      ).rejects.toThrow(NotMemberError);
    });

    it('should throw InvitationNotFoundError when invitation is not pending', async () => {
      // Arrange
      const acceptedInvitation = createTestInvitation({
        id: invitationId,
        teamId,
        email: 'invitee@example.com',
        status: 'accepted',
      });
      mockInvitationRepository.findById.mockResolvedValue(acceptedInvitation);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, invitationId)
      ).rejects.toThrow(InvitationNotFoundError);
    });

    it('should throw error for invalid actorUserId format', async () => {
      // Act & Assert
      await expect(
        useCase.execute('not-a-uuid', teamId, invitationId)
      ).rejects.toThrow();
    });

    it('should throw error for invalid invitationId format', async () => {
      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, 'not-a-uuid')
      ).rejects.toThrow();
    });
  });

  describe('execute - verification flow', () => {
    it('should fetch invitation first', async () => {
      // Act
      await useCase.execute(ownerId, teamId, invitationId);

      // Assert
      expect(mockInvitationRepository.findById).toHaveBeenCalled();
    });

    it('should verify team membership', async () => {
      // Act
      await useCase.execute(ownerId, teamId, invitationId);

      // Assert
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalled();
    });
  });
});

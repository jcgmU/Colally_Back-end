import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { CreateInvitationUseCase } from './create-invitation.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import type { ITeamInvitationRepository } from '@domain/team/ports/team-invitation-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  AlreadyMemberError,
  InvitationAlreadyExistsError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createTestInvitation,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('CreateInvitationUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();
  const mockInvitationRepository = mockDeep<ITeamInvitationRepository>();

  // Use case under test
  let useCase: CreateInvitationUseCase;

  // Test data
  const ownerId = TEST_IDS.user1;
  const adminId = TEST_IDS.user2;
  const memberId = TEST_IDS.user3;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId });
  const inviteeEmail = 'newuser@example.com';

  const ownerMembership = createOwnerMembership(ownerId, teamId);
  const adminMembership = createAdminMembership(adminId, teamId);
  const memberMembership = createMemberMembership(memberId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);
    mockReset(mockInvitationRepository);

    // Create fresh use case instance
    useCase = new CreateInvitationUseCase(mockTeamRepository, mockInvitationRepository);

    // Setup default mock behaviors (owner as actor)
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.isEmailMember.mockResolvedValue(false);
    mockInvitationRepository.findPendingByTeamAndEmail.mockResolvedValue(null);
    mockInvitationRepository.create.mockImplementation(async (inv) => inv);
  });

  describe('execute - owner creating invitations', () => {
    it('should allow owner to create invitation for member role', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, {
        email: inviteeEmail,
        role: 'member',
      });

      // Assert
      expect(result.invitation).toBeDefined();
      expect(result.invitation.email).toBe(inviteeEmail);
      expect(result.invitation.role).toBe('member');
      expect(result.invitation.status).toBe('pending');
    });

    it('should allow owner to create invitation for admin role', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, {
        email: inviteeEmail,
        role: 'admin',
      });

      // Assert
      expect(result.invitation.role).toBe('admin');
    });

    it('should call invitationRepository.create with correct data', async () => {
      // Act
      await useCase.execute(ownerId, teamId, {
        email: inviteeEmail,
        role: 'member',
      });

      // Assert
      expect(mockInvitationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.objectContaining({ value: inviteeEmail }),
          role: expect.objectContaining({ value: 'member' }),
        })
      );
    });
  });

  describe('execute - admin creating invitations', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
    });

    it('should allow admin to create invitation for member role', async () => {
      // Act
      const result = await useCase.execute(adminId, teamId, {
        email: inviteeEmail,
        role: 'member',
      });

      // Assert
      expect(result.invitation.role).toBe('member');
    });

    it('should throw InsufficientPermissionError when admin tries to invite as admin', async () => {
      // Act & Assert
      await expect(
        useCase.execute(adminId, teamId, {
          email: inviteeEmail,
          role: 'admin',
        })
      ).rejects.toThrow(InsufficientPermissionError);
    });
  });

  describe('execute - member creating invitations', () => {
    it('should throw InsufficientPermissionError when member tries to invite', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act & Assert
      await expect(
        useCase.execute(memberId, teamId, {
          email: inviteeEmail,
          role: 'member',
        })
      ).rejects.toThrow(InsufficientPermissionError);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, {
          email: inviteeEmail,
          role: 'member',
        })
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
        useCase.execute(ownerId, teamId, {
          email: inviteeEmail,
          role: 'member',
        })
      ).rejects.toThrow(NotMemberError);
    });

    it('should throw AlreadyMemberError when email is already a member', async () => {
      // Arrange
      mockTeamRepository.isEmailMember.mockResolvedValue(true);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, {
          email: inviteeEmail,
          role: 'member',
        })
      ).rejects.toThrow(AlreadyMemberError);
    });

    it('should throw InvitationAlreadyExistsError when pending invitation exists', async () => {
      // Arrange
      const existingInvitation = createTestInvitation({
        email: inviteeEmail,
        teamId,
        status: 'pending',
      });
      mockInvitationRepository.findPendingByTeamAndEmail.mockResolvedValue(existingInvitation);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, {
          email: inviteeEmail,
          role: 'member',
        })
      ).rejects.toThrow(InvitationAlreadyExistsError);
    });

    it('should throw validation error for invalid email', async () => {
      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, {
          email: 'invalid-email',
          role: 'member',
        })
      ).rejects.toThrow();
    });

    it('should throw validation error for invalid role', async () => {
      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, {
          email: inviteeEmail,
          role: 'owner' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('execute - output', () => {
    it('should return invitation output with all required fields', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, {
        email: inviteeEmail,
        role: 'member',
      });

      // Assert
      expect(result.invitation).toHaveProperty('id');
      expect(result.invitation).toHaveProperty('teamId');
      expect(result.invitation).toHaveProperty('email');
      expect(result.invitation).toHaveProperty('role');
      expect(result.invitation).toHaveProperty('status');
      expect(result.invitation).toHaveProperty('invitedBy');
      expect(result.invitation).toHaveProperty('expiresAt');
      expect(result.invitation).toHaveProperty('createdAt');
    });

    it('should set invitedBy to actor userId', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, {
        email: inviteeEmail,
        role: 'member',
      });

      // Assert
      expect(result.invitation.invitedBy).toBe(ownerId);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { AcceptInvitationUseCase } from './accept-invitation.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import type { ITeamInvitationRepository } from '@domain/team/ports/team-invitation-repository.port.js';
import { InvitationNotFoundError, AlreadyMemberError } from '@domain/team/errors/index.js';
import {
  createTestUser,
  createTestTeam,
  createTestInvitation,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('AcceptInvitationUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();
  const mockTeamRepository = mockDeep<ITeamRepository>();
  const mockInvitationRepository = mockDeep<ITeamInvitationRepository>();

  // Use case under test
  let useCase: AcceptInvitationUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const invitationId = TEST_IDS.invitation1;
  const userEmail = 'user@example.com';

  const testUser = createTestUser({ id: userId, email: userEmail });
  const testTeam = createTestTeam({ id: teamId, name: 'Test Team' });
  const testInvitation = createTestInvitation({
    id: invitationId,
    teamId,
    email: userEmail,
    role: 'member',
    status: 'pending',
  });

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockTeamRepository);
    mockReset(mockInvitationRepository);

    // Create fresh use case instance
    useCase = new AcceptInvitationUseCase(
      mockUserRepository,
      mockTeamRepository,
      mockInvitationRepository
    );

    // Setup default mock behaviors
    mockInvitationRepository.findById.mockResolvedValue(testInvitation);
    mockUserRepository.findById.mockResolvedValue(testUser);
    mockTeamRepository.getMembership.mockResolvedValue(null); // Not already a member
    mockTeamRepository.addMembership.mockImplementation(async (m) => m);
    mockInvitationRepository.update.mockImplementation(async (inv) => inv);
    mockTeamRepository.findById.mockResolvedValue(testTeam);
  });

  describe('execute - success cases', () => {
    it('should successfully accept invitation', async () => {
      // Act
      const result = await useCase.execute(userId, invitationId);

      // Assert
      expect(result.teamId).toBe(teamId);
      expect(result.teamName).toBe('Test Team');
      expect(result.role).toBe('member');
    });

    it('should create membership when accepting invitation', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockTeamRepository.addMembership).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.objectContaining({ value: userId }),
          teamId: expect.objectContaining({ value: teamId }),
          role: expect.objectContaining({ value: 'member' }),
        })
      );
    });

    it('should update invitation status', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockInvitationRepository.update).toHaveBeenCalled();
    });

    it('should accept admin role invitation', async () => {
      // Arrange
      const adminInvitation = createTestInvitation({
        id: invitationId,
        teamId,
        email: userEmail,
        role: 'admin',
        status: 'pending',
      });
      mockInvitationRepository.findById.mockResolvedValue(adminInvitation);

      // Act
      const result = await useCase.execute(userId, invitationId);

      // Assert
      expect(result.role).toBe('admin');
    });
  });

  describe('execute - error cases', () => {
    it('should throw InvitationNotFoundError when invitation does not exist', async () => {
      // Arrange
      mockInvitationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, invitationId)).rejects.toThrow(
        InvitationNotFoundError
      );
    });

    it('should throw InvitationNotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, invitationId)).rejects.toThrow(
        InvitationNotFoundError
      );
    });

    it('should throw AlreadyMemberError when user is already a member', async () => {
      // Arrange
      const existingMembership = createMemberMembership(userId, teamId);
      mockTeamRepository.getMembership.mockResolvedValue(existingMembership);

      // Act & Assert
      await expect(useCase.execute(userId, invitationId)).rejects.toThrow(
        AlreadyMemberError
      );
    });

    it('should throw error when email does not match', async () => {
      // Arrange
      const differentEmailInvitation = createTestInvitation({
        id: invitationId,
        teamId,
        email: 'different@example.com',
        status: 'pending',
      });
      mockInvitationRepository.findById.mockResolvedValue(differentEmailInvitation);

      // Act & Assert
      await expect(useCase.execute(userId, invitationId)).rejects.toThrow();
    });

    it('should throw error for invalid userId format', async () => {
      // Act & Assert
      await expect(useCase.execute('not-a-uuid', invitationId)).rejects.toThrow();
    });

    it('should throw error for invalid invitationId format', async () => {
      // Act & Assert
      await expect(useCase.execute(userId, 'not-a-uuid')).rejects.toThrow();
    });
  });

  describe('execute - expired invitation', () => {
    it('should throw error when invitation is expired', async () => {
      // Arrange
      const expiredInvitation = createTestInvitation({
        id: invitationId,
        teamId,
        email: userEmail,
        status: 'pending',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });
      mockInvitationRepository.findById.mockResolvedValue(expiredInvitation);

      // Act & Assert
      await expect(useCase.execute(userId, invitationId)).rejects.toThrow();
    });
  });

  describe('execute - verification flow', () => {
    it('should check membership before creating', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockTeamRepository.getMembership).toHaveBeenCalled();
    });

    it('should fetch team name for response', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockTeamRepository.findById).toHaveBeenCalled();
    });

    it('should return Unknown Team when team not found', async () => {
      // Arrange
      mockTeamRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(userId, invitationId);

      // Assert
      expect(result.teamName).toBe('Unknown Team');
    });
  });
});

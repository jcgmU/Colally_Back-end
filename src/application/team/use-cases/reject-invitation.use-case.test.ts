import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { RejectInvitationUseCase } from './reject-invitation.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type { ITeamInvitationRepository } from '@domain/team/ports/team-invitation-repository.port.js';
import {
  InvitationNotFoundError,
  InvitationEmailMismatchError,
} from '@domain/team/errors/index.js';
import {
  createTestUser,
  createTestInvitation,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('RejectInvitationUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();
  const mockInvitationRepository = mockDeep<ITeamInvitationRepository>();

  // Use case under test
  let useCase: RejectInvitationUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const invitationId = TEST_IDS.invitation1;
  const userEmail = 'user@example.com';

  const testUser = createTestUser({ id: userId, email: userEmail });
  const testInvitation = createTestInvitation({
    id: invitationId,
    teamId,
    email: userEmail,
    status: 'pending',
  });

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockInvitationRepository);

    // Create fresh use case instance
    useCase = new RejectInvitationUseCase(mockUserRepository, mockInvitationRepository);

    // Setup default mock behaviors
    mockInvitationRepository.findById.mockResolvedValue(testInvitation);
    mockUserRepository.findById.mockResolvedValue(testUser);
    mockInvitationRepository.update.mockImplementation(async (inv) => inv);
  });

  describe('execute - success cases', () => {
    it('should successfully reject invitation', async () => {
      // Act
      const result = await useCase.execute(userId, invitationId);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should update invitation status to rejected', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockInvitationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.objectContaining({ value: 'rejected' }),
        })
      );
    });

    it('should call repository with correct invitationId', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockInvitationRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: invitationId })
      );
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

    it('should throw InvitationEmailMismatchError when email does not match', async () => {
      // Arrange
      const differentEmailInvitation = createTestInvitation({
        id: invitationId,
        teamId,
        email: 'different@example.com',
        status: 'pending',
      });
      mockInvitationRepository.findById.mockResolvedValue(differentEmailInvitation);

      // Act & Assert
      await expect(useCase.execute(userId, invitationId)).rejects.toThrow(
        InvitationEmailMismatchError
      );
    });

    it('should throw error when invitation is not pending', async () => {
      // Arrange
      const acceptedInvitation = createTestInvitation({
        id: invitationId,
        teamId,
        email: userEmail,
        status: 'accepted',
      });
      mockInvitationRepository.findById.mockResolvedValue(acceptedInvitation);

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

  describe('execute - verification flow', () => {
    it('should fetch user to verify email', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId })
      );
    });

    it('should fetch invitation by id', async () => {
      // Act
      await useCase.execute(userId, invitationId);

      // Assert
      expect(mockInvitationRepository.findById).toHaveBeenCalled();
    });
  });
});

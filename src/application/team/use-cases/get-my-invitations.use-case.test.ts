import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { GetMyInvitationsUseCase } from './get-my-invitations.use-case.js';
import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type {
  ITeamInvitationRepository,
  InvitationWithTeamName,
} from '@domain/team/ports/team-invitation-repository.port.js';
import { createTestUser, TEST_IDS } from '@shared/test/factories/index.js';
import { createTestInvitation } from '@shared/test/factories/team.factory.js';

describe('GetMyInvitationsUseCase', () => {
  // Mocks
  const mockUserRepository = mockDeep<IUserRepository>();
  const mockInvitationRepository = mockDeep<ITeamInvitationRepository>();

  // Use case under test
  let useCase: GetMyInvitationsUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const userEmail = 'user@example.com';
  const testUser = createTestUser({ id: userId, email: userEmail });

  const invitationsWithTeam: InvitationWithTeamName[] = [
    {
      invitation: createTestInvitation({ teamId: TEST_IDS.team1, email: userEmail }),
      teamName: 'Team Alpha',
      inviterName: 'John Doe',
    },
    {
      invitation: createTestInvitation({ teamId: TEST_IDS.team2, email: userEmail, role: 'admin' }),
      teamName: 'Team Beta',
      inviterName: 'Jane Smith',
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockInvitationRepository);

    // Create fresh use case instance
    useCase = new GetMyInvitationsUseCase(mockUserRepository, mockInvitationRepository);

    // Setup default mock behaviors
    mockUserRepository.findById.mockResolvedValue(testUser);
    mockInvitationRepository.findPendingByEmail.mockResolvedValue(invitationsWithTeam);
  });

  describe('execute - success cases', () => {
    it('should return all pending invitations for the user', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.invitations).toHaveLength(2);
    });

    it('should return invitation with team name', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.invitations[0].teamName).toBe('Team Alpha');
      expect(result.invitations[1].teamName).toBe('Team Beta');
    });

    it('should return invitation with inviter name', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.invitations[0].inviterName).toBe('John Doe');
      expect(result.invitations[1].inviterName).toBe('Jane Smith');
    });

    it('should call userRepository with correct userId', async () => {
      // Act
      await useCase.execute(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId })
      );
    });

    it('should call invitationRepository with user email', async () => {
      // Act
      await useCase.execute(userId);

      // Assert
      expect(mockInvitationRepository.findPendingByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: userEmail })
      );
    });
  });

  describe('execute - user not found', () => {
    it('should return empty array when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.invitations).toHaveLength(0);
      expect(mockInvitationRepository.findPendingByEmail).not.toHaveBeenCalled();
    });
  });

  describe('execute - no invitations', () => {
    it('should return empty array when no invitations exist', async () => {
      // Arrange
      mockInvitationRepository.findPendingByEmail.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.invitations).toHaveLength(0);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw error for invalid userId format', async () => {
      // Act & Assert
      await expect(useCase.execute('not-a-uuid')).rejects.toThrow();
    });
  });

  describe('execute - output format', () => {
    it('should return invitation output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      const invitation = result.invitations[0].invitation;
      expect(invitation).toHaveProperty('id');
      expect(invitation).toHaveProperty('teamId');
      expect(invitation).toHaveProperty('email');
      expect(invitation).toHaveProperty('role');
      expect(invitation).toHaveProperty('status');
      expect(invitation).toHaveProperty('invitedBy');
      expect(invitation).toHaveProperty('expiresAt');
      expect(invitation).toHaveProperty('createdAt');
    });

    it('should include inviterName in invitation output', async () => {
      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.invitations[0].invitation).toHaveProperty('inviterName');
    });
  });
});

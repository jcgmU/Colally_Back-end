import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { RemoveMemberUseCase } from './remove-member.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  CannotRemoveOwnerError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('RemoveMemberUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: RemoveMemberUseCase;

  // Test data
  const ownerId = TEST_IDS.user1;
  const adminId = TEST_IDS.user2;
  const memberId = TEST_IDS.user3;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId });

  const ownerMembership = createOwnerMembership(ownerId, teamId);
  const adminMembership = createAdminMembership(adminId, teamId);
  const memberMembership = createMemberMembership(memberId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new RemoveMemberUseCase(mockTeamRepository);

    // Setup default mock behaviors (owner as actor)
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.getMembership.mockResolvedValue(memberMembership);
    mockTeamRepository.removeMembership.mockResolvedValue(undefined);
  });

  describe('execute - owner removing members', () => {
    it('should allow owner to remove a member', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, memberId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTeamRepository.removeMembership).toHaveBeenCalledTimes(1);
    });

    it('should allow owner to remove an admin', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(adminMembership);

      // Act
      const result = await useCase.execute(ownerId, teamId, adminId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTeamRepository.removeMembership).toHaveBeenCalled();
    });

    it('should throw CannotRemoveOwnerError when trying to remove owner', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(ownerMembership);

      // Act & Assert
      await expect(useCase.execute(ownerId, teamId, ownerId)).rejects.toThrow(
        CannotRemoveOwnerError
      );
      expect(mockTeamRepository.removeMembership).not.toHaveBeenCalled();
    });

    it('should call removeMembership with correct IDs', async () => {
      // Act
      await useCase.execute(ownerId, teamId, memberId);

      // Assert
      expect(mockTeamRepository.removeMembership).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        expect.objectContaining({ value: memberId })
      );
    });
  });

  describe('execute - admin removing members', () => {
    beforeEach(() => {
      // Setup admin as actor
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
    });

    it('should allow admin to remove a member', async () => {
      // Act
      const result = await useCase.execute(adminId, teamId, memberId);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should throw InsufficientPermissionError when admin tries to remove another admin', async () => {
      // Arrange
      const otherAdminId = '550e8400-e29b-41d4-a716-446655440099';
      const otherAdminMembership = createAdminMembership(otherAdminId, teamId);
      mockTeamRepository.getMembership.mockResolvedValue(otherAdminMembership);

      // Act & Assert
      await expect(useCase.execute(adminId, teamId, otherAdminId)).rejects.toThrow(
        InsufficientPermissionError
      );
    });

    it('should throw CannotRemoveOwnerError when admin tries to remove owner', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(ownerMembership);

      // Act & Assert
      await expect(useCase.execute(adminId, teamId, ownerId)).rejects.toThrow(
        CannotRemoveOwnerError
      );
    });
  });

  describe('execute - member removing members', () => {
    it('should throw InsufficientPermissionError when member tries to remove another member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });
      const otherMemberId = '550e8400-e29b-41d4-a716-446655440099';
      const otherMemberMembership = createMemberMembership(otherMemberId, teamId);
      mockTeamRepository.getMembership.mockResolvedValue(otherMemberMembership);

      // Act & Assert
      await expect(useCase.execute(memberId, teamId, otherMemberId)).rejects.toThrow(
        InsufficientPermissionError
      );
    });
  });

  describe('execute - self removal prevention', () => {
    it('should throw InsufficientPermissionError when trying to remove yourself', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(ownerMembership);

      // Act & Assert - Note: Owner removing self hits "cannot remove owner" first,
      // but for admin trying to remove themselves:
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
      mockTeamRepository.getMembership.mockResolvedValue(adminMembership);

      await expect(useCase.execute(adminId, teamId, adminId)).rejects.toThrow(
        InsufficientPermissionError
      );
    });
  });

  describe('execute - validation and errors', () => {
    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(ownerId, teamId, memberId)).rejects.toThrow(
        TeamNotFoundError
      );
    });

    it('should throw NotMemberError when actor is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(useCase.execute(ownerId, teamId, memberId)).rejects.toThrow(
        NotMemberError
      );
    });

    it('should throw NotMemberError when target is not a member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(ownerId, teamId, memberId)).rejects.toThrow(
        NotMemberError
      );
    });

    it('should throw error for invalid actorUserId format', async () => {
      // Act & Assert
      await expect(useCase.execute('not-a-uuid', teamId, memberId)).rejects.toThrow();
    });

    it('should throw error for invalid targetUserId format', async () => {
      // Act & Assert
      await expect(useCase.execute(ownerId, teamId, 'not-a-uuid')).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Act & Assert
      await expect(useCase.execute(ownerId, 'not-a-uuid', memberId)).rejects.toThrow();
    });
  });
});

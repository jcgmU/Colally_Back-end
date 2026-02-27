import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { LeaveTeamUseCase } from './leave-team.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('LeaveTeamUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: LeaveTeamUseCase;

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
    useCase = new LeaveTeamUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.removeMembership.mockResolvedValue(undefined);
  });

  describe('execute - member leaving', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });
    });

    it('should allow member to leave the team', async () => {
      // Act
      const result = await useCase.execute(memberId, teamId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTeamRepository.removeMembership).toHaveBeenCalledTimes(1);
    });

    it('should call removeMembership with correct IDs', async () => {
      // Act
      await useCase.execute(memberId, teamId);

      // Assert
      expect(mockTeamRepository.removeMembership).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        expect.objectContaining({ value: memberId })
      );
    });
  });

  describe('execute - admin leaving', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
    });

    it('should allow admin to leave the team', async () => {
      // Act
      const result = await useCase.execute(adminId, teamId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTeamRepository.removeMembership).toHaveBeenCalled();
    });
  });

  describe('execute - owner leaving', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: ownerMembership,
      });
    });

    it('should throw OwnerCannotLeaveError when owner tries to leave', async () => {
      // Act & Assert
      await expect(useCase.execute(ownerId, teamId)).rejects.toThrow(
        OwnerCannotLeaveError
      );
      expect(mockTeamRepository.removeMembership).not.toHaveBeenCalled();
    });

    it('should provide helpful error message for owner', async () => {
      // Act & Assert
      await expect(useCase.execute(ownerId, teamId)).rejects.toThrow(
        /transfer ownership.*delete/i
      );
    });
  });

  describe('execute - validation and errors', () => {
    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(memberId, teamId)).rejects.toThrow(
        TeamNotFoundError
      );
      expect(mockTeamRepository.removeMembership).not.toHaveBeenCalled();
    });

    it('should throw NotMemberError when user is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(useCase.execute(memberId, teamId)).rejects.toThrow(
        NotMemberError
      );
      expect(mockTeamRepository.removeMembership).not.toHaveBeenCalled();
    });

    it('should throw error for invalid userId format', async () => {
      // Act & Assert
      await expect(useCase.execute('not-a-uuid', teamId)).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Act & Assert
      await expect(useCase.execute(memberId, 'not-a-uuid')).rejects.toThrow();
    });
  });

  describe('execute - verification flow', () => {
    beforeEach(() => {
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });
    });

    it('should check membership before removing', async () => {
      // Act
      await useCase.execute(memberId, teamId);

      // Assert
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalledBefore(
        mockTeamRepository.removeMembership
      );
    });

    it('should check membership with correct parameters', async () => {
      // Act
      await useCase.execute(memberId, teamId);

      // Assert
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        expect.objectContaining({ value: memberId })
      );
    });
  });
});

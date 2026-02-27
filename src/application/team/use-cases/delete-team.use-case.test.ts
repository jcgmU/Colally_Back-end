import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { DeleteTeamUseCase } from './delete-team.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('DeleteTeamUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: DeleteTeamUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId, name: 'Team To Delete' });
  const ownerMembership = createOwnerMembership(userId, teamId);
  const adminMembership = createAdminMembership(userId, teamId);
  const memberMembership = createMemberMembership(userId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new DeleteTeamUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.delete.mockResolvedValue(undefined);
  });

  describe('execute', () => {
    it('should successfully delete team as owner', async () => {
      // Act
      const result = await useCase.execute(userId, teamId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTeamRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should call repository.delete with correct teamId', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockTeamRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId })
      );
    });

    it('should check membership before deleting', async () => {
      // Act
      await useCase.execute(userId, teamId);

      // Assert
      expect(mockTeamRepository.findByIdWithMembership).toHaveBeenCalledWith(
        expect.objectContaining({ value: teamId }),
        expect.objectContaining({ value: userId })
      );
    });

    it('should throw InsufficientPermissionError when admin tries to delete', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(
        InsufficientPermissionError
      );
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InsufficientPermissionError when member tries to delete', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(
        InsufficientPermissionError
      );
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(userId, teamId)).rejects.toThrow(
        TeamNotFoundError
      );
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
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
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error for invalid userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId, teamId)).rejects.toThrow();
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error for invalid teamId format', async () => {
      // Arrange
      const invalidTeamId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(userId, invalidTeamId)).rejects.toThrow();
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
    });
  });
});

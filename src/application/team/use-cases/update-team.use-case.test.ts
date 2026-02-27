import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { UpdateTeamUseCase } from './update-team.use-case.js';
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

describe('UpdateTeamUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: UpdateTeamUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId, name: 'Original Name', description: 'Original description' });
  const ownerMembership = createOwnerMembership(userId, teamId);
  const adminMembership = createAdminMembership(userId, teamId);
  const memberMembership = createMemberMembership(userId, teamId);

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new UpdateTeamUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.findById.mockResolvedValue(testTeam);
    mockTeamRepository.update.mockImplementation(async (team) => team);
  });

  describe('execute', () => {
    it('should successfully update team name', async () => {
      // Arrange
      const input = { name: 'New Team Name' };

      // Act
      const result = await useCase.execute(userId, teamId, input);

      // Assert
      expect(result.team.name).toBe('New Team Name');
      expect(mockTeamRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should successfully update team description', async () => {
      // Arrange
      const input = { description: 'New description' };

      // Act
      const result = await useCase.execute(userId, teamId, input);

      // Assert
      expect(result.team.description).toBe('New description');
      expect(mockTeamRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should successfully update both name and description', async () => {
      // Arrange
      const input = { name: 'New Name', description: 'New description' };

      // Act
      const result = await useCase.execute(userId, teamId, input);

      // Assert
      expect(result.team.name).toBe('New Name');
      expect(result.team.description).toBe('New description');
    });

    it('should allow setting description to null', async () => {
      // Arrange
      const input = { description: null };

      // Act
      const result = await useCase.execute(userId, teamId, input);

      // Assert
      expect(result.team.description).toBeNull();
    });

    it('should return current team when no fields to update', async () => {
      // Arrange
      const input = {};

      // Act
      const result = await useCase.execute(userId, teamId, input);

      // Assert
      expect(result.team.name).toBe('Original Name');
      expect(mockTeamRepository.update).not.toHaveBeenCalled();
      expect(mockTeamRepository.findById).toHaveBeenCalled();
    });

    it('should allow owner to update team', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: ownerMembership,
      });

      // Act
      const result = await useCase.execute(userId, teamId, { name: 'New Name' });

      // Assert
      expect(result.team.name).toBe('New Name');
    });

    it('should allow admin to update team', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });

      // Act
      const result = await useCase.execute(userId, teamId, { name: 'New Name' });

      // Assert
      expect(result.team.name).toBe('New Name');
    });

    it('should throw InsufficientPermissionError when member tries to update', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act & Assert
      await expect(
        useCase.execute(userId, teamId, { name: 'New Name' })
      ).rejects.toThrow(InsufficientPermissionError);
      expect(mockTeamRepository.update).not.toHaveBeenCalled();
    });

    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(userId, teamId, { name: 'New Name' })
      ).rejects.toThrow(TeamNotFoundError);
    });

    it('should throw NotMemberError when user is not a member', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: null,
      });

      // Act & Assert
      await expect(
        useCase.execute(userId, teamId, { name: 'New Name' })
      ).rejects.toThrow(NotMemberError);
    });

    it('should throw validation error for empty team name', async () => {
      // Arrange
      const invalidInput = { name: '' };

      // Act & Assert
      await expect(useCase.execute(userId, teamId, invalidInput)).rejects.toThrow();
      expect(mockTeamRepository.update).not.toHaveBeenCalled();
    });

    it('should throw validation error for team name exceeding max length', async () => {
      // Arrange
      const invalidInput = { name: 'a'.repeat(101) };

      // Act & Assert
      await expect(useCase.execute(userId, teamId, invalidInput)).rejects.toThrow();
      expect(mockTeamRepository.update).not.toHaveBeenCalled();
    });

    it('should throw validation error for description exceeding max length', async () => {
      // Arrange
      const invalidInput = { description: 'a'.repeat(1001) };

      // Act & Assert
      await expect(useCase.execute(userId, teamId, invalidInput)).rejects.toThrow();
      expect(mockTeamRepository.update).not.toHaveBeenCalled();
    });

    it('should call repository.update with updated team', async () => {
      // Arrange
      const input = { name: 'New Name' };

      // Act
      await useCase.execute(userId, teamId, input);

      // Assert
      expect(mockTeamRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.objectContaining({ value: 'New Name' }),
        })
      );
    });
  });
});

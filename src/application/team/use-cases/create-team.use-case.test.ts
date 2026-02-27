import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { CreateTeamUseCase } from './create-team.use-case.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import { createTestTeam, TEST_IDS } from '@shared/test/factories/index.js';

describe('CreateTeamUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: CreateTeamUseCase;

  // Test data
  const userId = TEST_IDS.user1;
  const validInput = {
    name: 'My Awesome Team',
    description: 'A team for awesome people',
  };

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new CreateTeamUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.create.mockImplementation(async (team, _ownerId) => {
      // Return a reconstituted team with same data
      return createTestTeam({
        id: team.id.value,
        name: team.name.value,
        description: team.description,
      });
    });
  });

  describe('execute', () => {
    it('should successfully create a new team', async () => {
      // Act
      const result = await useCase.execute(userId, validInput);

      // Assert
      expect(result.team).toBeDefined();
      expect(result.team.name).toBe(validInput.name);
      expect(result.team.description).toBe(validInput.description);
      expect(result.team.id).toBeDefined();
    });

    it('should call repository.create with team and owner id', async () => {
      // Act
      await useCase.execute(userId, validInput);

      // Assert
      expect(mockTeamRepository.create).toHaveBeenCalledTimes(1);
      expect(mockTeamRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.objectContaining({ value: validInput.name }),
        }),
        expect.objectContaining({ value: userId })
      );
    });

    it('should create team with null description when not provided', async () => {
      // Arrange
      const inputWithoutDescription = { name: 'Team Without Description' };

      // Act
      const result = await useCase.execute(userId, inputWithoutDescription);

      // Assert
      expect(mockTeamRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
        expect.anything()
      );
    });

    it('should throw validation error for empty team name', async () => {
      // Arrange
      const invalidInput = { name: '' };

      // Act & Assert
      await expect(useCase.execute(userId, invalidInput)).rejects.toThrow();
      expect(mockTeamRepository.create).not.toHaveBeenCalled();
    });

    it('should throw validation error for team name exceeding max length', async () => {
      // Arrange
      const invalidInput = { name: 'a'.repeat(101) };

      // Act & Assert
      await expect(useCase.execute(userId, invalidInput)).rejects.toThrow();
      expect(mockTeamRepository.create).not.toHaveBeenCalled();
    });

    it('should throw validation error for description exceeding max length', async () => {
      // Arrange
      const invalidInput = {
        name: 'Valid Name',
        description: 'a'.repeat(1001),
      };

      // Act & Assert
      await expect(useCase.execute(userId, invalidInput)).rejects.toThrow();
      expect(mockTeamRepository.create).not.toHaveBeenCalled();
    });

    it('should accept team with max valid name length', async () => {
      // Arrange
      const inputWithMaxName = { name: 'a'.repeat(100) };

      // Act
      const result = await useCase.execute(userId, inputWithMaxName);

      // Assert
      expect(result.team.name).toBe(inputWithMaxName.name);
    });

    it('should return team output with all required fields', async () => {
      // Act
      const result = await useCase.execute(userId, validInput);

      // Assert
      expect(result.team).toHaveProperty('id');
      expect(result.team).toHaveProperty('name');
      expect(result.team).toHaveProperty('description');
      expect(result.team).toHaveProperty('createdAt');
      expect(result.team).toHaveProperty('updatedAt');
    });

    it('should throw error for invalid userId format', async () => {
      // Arrange
      const invalidUserId = 'not-a-uuid';

      // Act & Assert
      await expect(useCase.execute(invalidUserId, validInput)).rejects.toThrow();
    });
  });
});

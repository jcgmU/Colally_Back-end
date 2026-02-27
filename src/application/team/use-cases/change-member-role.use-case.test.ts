import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import { ChangeMemberRoleUseCase } from './change-member-role.use-case.js';
import type {
  ITeamRepository,
  MembershipWithUser,
} from '@domain/team/ports/team-repository.port.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  CannotDemoteOwnerError,
} from '@domain/team/errors/index.js';
import {
  createTestTeam,
  createOwnerMembership,
  createAdminMembership,
  createMemberMembership,
  TEST_IDS,
} from '@shared/test/factories/index.js';

describe('ChangeMemberRoleUseCase', () => {
  // Mocks
  const mockTeamRepository = mockDeep<ITeamRepository>();

  // Use case under test
  let useCase: ChangeMemberRoleUseCase;

  // Test data
  const ownerId = TEST_IDS.user1;
  const adminId = TEST_IDS.user2;
  const memberId = TEST_IDS.user3;
  const teamId = TEST_IDS.team1;
  const testTeam = createTestTeam({ id: teamId });

  const ownerMembership = createOwnerMembership(ownerId, teamId);
  const adminMembership = createAdminMembership(adminId, teamId);
  const memberMembership = createMemberMembership(memberId, teamId);

  const createMembershipWithUser = (
    membership: ReturnType<typeof createOwnerMembership>,
    name: string,
    email: string
  ): MembershipWithUser => ({
    membership,
    userName: name,
    userEmail: email,
    userAvatarUrl: null,
  });

  beforeEach(() => {
    // Reset all mocks
    mockReset(mockTeamRepository);

    // Create fresh use case instance
    useCase = new ChangeMemberRoleUseCase(mockTeamRepository);

    // Setup default mock behaviors
    mockTeamRepository.findByIdWithMembership.mockResolvedValue({
      team: testTeam,
      membership: ownerMembership,
    });
    mockTeamRepository.getMembership.mockResolvedValue(memberMembership);
    mockTeamRepository.updateMembership.mockImplementation(async (m) => m);
    mockTeamRepository.getMemberships.mockResolvedValue([
      createMembershipWithUser(ownerMembership, 'Owner', 'owner@example.com'),
      createMembershipWithUser(adminMembership, 'Admin', 'admin@example.com'),
      createMembershipWithUser(memberMembership, 'Member', 'member@example.com'),
    ]);
  });

  describe('execute - owner changing roles', () => {
    it('should allow owner to promote member to admin', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, memberId, { role: 'admin' });

      // Assert
      expect(mockTeamRepository.updateMembership).toHaveBeenCalled();
      expect(result.member).toBeDefined();
    });

    it('should allow owner to demote admin to member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(adminMembership);

      // Act
      const result = await useCase.execute(ownerId, teamId, adminId, { role: 'member' });

      // Assert
      expect(mockTeamRepository.updateMembership).toHaveBeenCalled();
      expect(result.member).toBeDefined();
    });

    it('should throw CannotDemoteOwnerError when trying to demote owner', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(ownerMembership);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, ownerId, { role: 'admin' })
      ).rejects.toThrow(CannotDemoteOwnerError);
    });
  });

  describe('execute - admin changing roles', () => {
    beforeEach(() => {
      // Setup admin as actor
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: adminMembership,
      });
    });

    it('should allow admin to promote member to admin', async () => {
      // Act
      const result = await useCase.execute(adminId, teamId, memberId, { role: 'admin' });

      // Assert
      expect(mockTeamRepository.updateMembership).toHaveBeenCalled();
      expect(result.member).toBeDefined();
    });

    it('should throw InsufficientPermissionError when admin tries to demote another admin', async () => {
      // Arrange
      const otherAdminId = '550e8400-e29b-41d4-a716-446655440099';
      const otherAdminMembership = createAdminMembership(otherAdminId, teamId);
      mockTeamRepository.getMembership.mockResolvedValue(otherAdminMembership);

      // Act & Assert
      await expect(
        useCase.execute(adminId, teamId, otherAdminId, { role: 'member' })
      ).rejects.toThrow(InsufficientPermissionError);
    });

    it('should throw CannotDemoteOwnerError when admin tries to demote owner', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(ownerMembership);

      // Act & Assert
      await expect(
        useCase.execute(adminId, teamId, ownerId, { role: 'member' })
      ).rejects.toThrow(CannotDemoteOwnerError);
    });
  });

  describe('execute - member changing roles', () => {
    it('should throw InsufficientPermissionError when member tries to change roles', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue({
        team: testTeam,
        membership: memberMembership,
      });

      // Act & Assert
      await expect(
        useCase.execute(memberId, teamId, adminId, { role: 'member' })
      ).rejects.toThrow(InsufficientPermissionError);
    });
  });

  describe('execute - validation and errors', () => {
    it('should throw TeamNotFoundError when team does not exist', async () => {
      // Arrange
      mockTeamRepository.findByIdWithMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, memberId, { role: 'admin' })
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
        useCase.execute(ownerId, teamId, memberId, { role: 'admin' })
      ).rejects.toThrow(NotMemberError);
    });

    it('should throw NotMemberError when target is not a member', async () => {
      // Arrange
      mockTeamRepository.getMembership.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, memberId, { role: 'admin' })
      ).rejects.toThrow(NotMemberError);
    });

    it('should throw validation error for invalid role', async () => {
      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, memberId, { role: 'invalid' as any })
      ).rejects.toThrow();
    });

    it('should throw error for invalid actorUserId format', async () => {
      // Act & Assert
      await expect(
        useCase.execute('not-a-uuid', teamId, memberId, { role: 'admin' })
      ).rejects.toThrow();
    });

    it('should throw error for invalid targetUserId format', async () => {
      // Act & Assert
      await expect(
        useCase.execute(ownerId, teamId, 'not-a-uuid', { role: 'admin' })
      ).rejects.toThrow();
    });

    it('should throw error for invalid teamId format', async () => {
      // Act & Assert
      await expect(
        useCase.execute(ownerId, 'not-a-uuid', memberId, { role: 'admin' })
      ).rejects.toThrow();
    });
  });

  describe('execute - output', () => {
    it('should return member output with all required fields', async () => {
      // Act
      const result = await useCase.execute(ownerId, teamId, memberId, { role: 'admin' });

      // Assert
      expect(result.member).toHaveProperty('id');
      expect(result.member).toHaveProperty('userId');
      expect(result.member).toHaveProperty('userName');
      expect(result.member).toHaveProperty('userEmail');
      expect(result.member).toHaveProperty('role');
      expect(result.member).toHaveProperty('joinedAt');
    });
  });
});

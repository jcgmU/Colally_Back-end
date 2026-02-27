import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  CannotDemoteOwnerError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId, TeamRole } from '@domain/team/value-objects/index.js';

import {
  type ChangeMemberRoleInput,
  type ChangeMemberRoleOutput,
  type MemberOutput,
  ChangeMemberRoleInputSchema,
} from '../dtos/index.js';

/**
 * Change Member Role Use Case
 * Allows admins/owners to change a member's role
 *
 * Rules:
 * - Only owner or admin can change roles
 * - Admin can only change members to admin or member
 * - Owner can change anyone (except themselves) to any role except owner
 * - Cannot demote the owner
 */
@injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    actorUserId: string,
    teamId: string,
    targetUserId: string,
    input: ChangeMemberRoleInput
  ): Promise<ChangeMemberRoleOutput> {
    // Validate input
    const validatedInput = ChangeMemberRoleInputSchema.parse(input);

    const actorUserIdVO = UserId.create(actorUserId);
    const teamIdVO = TeamId.create(teamId);
    const targetUserIdVO = UserId.create(targetUserId);
    const newRole = TeamRole.create(validatedInput.role);

    // Verify team exists and actor is a member
    const teamResult = await this.teamRepository.findByIdWithMembership(teamIdVO, actorUserIdVO);

    if (teamResult === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (teamResult.membership === null) {
      throw new NotMemberError();
    }

    const actorRole = teamResult.membership.role;

    // Check actor has permission (must be owner or admin)
    if (!actorRole.isAtLeast(TeamRole.ADMIN)) {
      throw new InsufficientPermissionError('change member roles');
    }

    // Get target membership
    const targetMembership = await this.teamRepository.getMembership(teamIdVO, targetUserIdVO);

    if (targetMembership === null) {
      throw new NotMemberError();
    }

    // Cannot demote owner
    if (targetMembership.role.isOwner()) {
      throw new CannotDemoteOwnerError();
    }

    // Admin cannot change roles to something higher than themselves
    if (actorRole.isAdmin() && newRole.isHigherThan(actorRole)) {
      throw new InsufficientPermissionError('assign a role higher than your own');
    }

    // Admin cannot modify other admins
    if (actorRole.isAdmin() && targetMembership.role.isAdmin()) {
      throw new InsufficientPermissionError('change another admin\'s role');
    }

    // Update role
    const updatedMembership = targetMembership.changeRole(newRole);
    await this.teamRepository.updateMembership(updatedMembership);

    // Fetch user details for output
    const memberships = await this.teamRepository.getMemberships(teamIdVO);
    const memberWithUser = memberships.find(
      (m) => m.membership.userId.value === targetUserId
    );

    if (!memberWithUser) {
      // This shouldn't happen, but handle gracefully
      throw new NotMemberError();
    }

    return {
      member: this.toMemberOutput(memberWithUser),
    };
  }

  private toMemberOutput(data: {
    membership: { id: { value: string }; userId: { value: string }; role: { value: string }; joinedAt: Date };
    userName: string;
    userEmail: string;
    userAvatarUrl: string | null;
  }): MemberOutput {
    return {
      id: data.membership.id.value,
      userId: data.membership.userId.value,
      userName: data.userName,
      userEmail: data.userEmail,
      userAvatarUrl: data.userAvatarUrl,
      role: data.membership.role.value,
      joinedAt: data.membership.joinedAt,
    };
  }
}

import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  CannotRemoveOwnerError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';

import { type RemoveMemberOutput } from '../dtos/index.js';

/**
 * Remove Member Use Case
 * Allows admins/owners to remove a member from the team
 *
 * Rules:
 * - Only owner or admin can remove members
 * - Cannot remove the owner
 * - Admin can only remove regular members (not other admins)
 * - Owner can remove anyone except themselves
 */
@injectable()
export class RemoveMemberUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    actorUserId: string,
    teamId: string,
    targetUserId: string
  ): Promise<RemoveMemberOutput> {
    const actorUserIdVO = UserId.create(actorUserId);
    const teamIdVO = TeamId.create(teamId);
    const targetUserIdVO = UserId.create(targetUserId);

    // Verify team exists and actor is a member
    const teamResult = await this.teamRepository.findByIdWithMembership(teamIdVO, actorUserIdVO);

    if (teamResult === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (teamResult.membership === null) {
      throw new NotMemberError();
    }

    const actorMembership = teamResult.membership;

    // Check actor has permission (must be owner or admin)
    if (!actorMembership.canManageMembers()) {
      throw new InsufficientPermissionError('remove team members');
    }

    // Get target membership
    const targetMembership = await this.teamRepository.getMembership(teamIdVO, targetUserIdVO);

    if (targetMembership === null) {
      throw new NotMemberError();
    }

    // Cannot remove owner
    if (targetMembership.role.isOwner()) {
      throw new CannotRemoveOwnerError();
    }

    // Check if actor can remove target based on roles
    if (!actorMembership.canRemove(targetMembership.role)) {
      throw new InsufficientPermissionError('remove this member');
    }

    // Prevent removing yourself (use LeaveTeam instead)
    if (actorUserId === targetUserId) {
      throw new InsufficientPermissionError('remove yourself. Use leave team instead');
    }

    // Remove the membership
    await this.teamRepository.removeMembership(teamIdVO, targetUserIdVO);

    return {
      success: true,
    };
  }
}

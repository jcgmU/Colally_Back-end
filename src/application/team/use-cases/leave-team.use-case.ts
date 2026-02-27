import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';

import { type LeaveTeamOutput } from '../dtos/index.js';

/**
 * Leave Team Use Case
 * Allows a member to voluntarily leave a team
 *
 * Rules:
 * - Any member can leave
 * - Owner cannot leave (must transfer ownership first or delete the team)
 */
@injectable()
export class LeaveTeamUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(userId: string, teamId: string): Promise<LeaveTeamOutput> {
    const userIdVO = UserId.create(userId);
    const teamIdVO = TeamId.create(teamId);

    // Verify team exists and user is a member
    const teamResult = await this.teamRepository.findByIdWithMembership(teamIdVO, userIdVO);

    if (teamResult === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (teamResult.membership === null) {
      throw new NotMemberError();
    }

    // Owner cannot leave
    if (teamResult.membership.isOwner()) {
      throw new OwnerCannotLeaveError();
    }

    // Remove the membership
    await this.teamRepository.removeMembership(teamIdVO, userIdVO);

    return {
      success: true,
    };
  }
}

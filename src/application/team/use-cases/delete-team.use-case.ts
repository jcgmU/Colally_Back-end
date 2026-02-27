import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';

import { type DeleteTeamOutput } from '../dtos/index.js';

/**
 * Delete Team Use Case
 * Deletes a team - requires owner role
 */
@injectable()
export class DeleteTeamUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(userId: string, teamId: string): Promise<DeleteTeamOutput> {
    const userIdVO = UserId.create(userId);
    const teamIdVO = TeamId.create(teamId);

    // Get team with membership to check permissions
    const result = await this.teamRepository.findByIdWithMembership(teamIdVO, userIdVO);

    if (result === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (result.membership === null) {
      throw new NotMemberError();
    }

    // Only owner can delete team
    if (!result.membership.canDeleteTeam()) {
      throw new InsufficientPermissionError('delete team');
    }

    // Delete team (cascades to memberships and invitations via DB)
    await this.teamRepository.delete(teamIdVO);

    return {
      success: true,
    };
  }
}

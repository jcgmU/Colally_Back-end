import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Team } from '@domain/team/entities/index.js';
import { TeamNotFoundError, NotMemberError } from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';

import { type GetTeamOutput, type TeamOutput } from '../dtos/index.js';

/**
 * Get Team Use Case
 * Retrieves team details for a member
 */
@injectable()
export class GetTeamUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(userId: string, teamId: string): Promise<GetTeamOutput> {
    const userIdVO = UserId.create(userId);
    const teamIdVO = TeamId.create(teamId);

    // Get team with user's membership
    const result = await this.teamRepository.findByIdWithMembership(teamIdVO, userIdVO);

    if (result === null) {
      throw new TeamNotFoundError(teamId);
    }

    // User must be a member to view the team
    if (result.membership === null) {
      throw new NotMemberError();
    }

    // Get member count
    const memberCount = await this.teamRepository.countMembers(teamIdVO);

    return {
      team: this.toTeamOutput(result.team),
      role: result.membership.role.value,
      memberCount,
    };
  }

  private toTeamOutput(team: Team): TeamOutput {
    return {
      id: team.id.value,
      name: team.name.value,
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}

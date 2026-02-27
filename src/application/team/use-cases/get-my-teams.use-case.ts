import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Team } from '@domain/team/entities/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';

import { type GetMyTeamsOutput, type TeamOutput, type TeamWithRoleOutput } from '../dtos/index.js';

/**
 * Get My Teams Use Case
 * Lists all teams the current user belongs to
 */
@injectable()
export class GetMyTeamsUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(userId: string): Promise<GetMyTeamsOutput> {
    const userIdVO = UserId.create(userId);

    const teamsWithRoles = await this.teamRepository.findByUserId(userIdVO);

    return {
      teams: teamsWithRoles.map((twr) => this.toTeamWithRoleOutput(twr.team, twr.role.value)),
    };
  }

  private toTeamWithRoleOutput(team: Team, role: string): TeamWithRoleOutput {
    return {
      team: this.toTeamOutput(team),
      role,
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

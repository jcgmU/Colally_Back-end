import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Team } from '@domain/team/entities/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId, TeamName } from '@domain/team/value-objects/index.js';

import {
  type UpdateTeamInput,
  UpdateTeamInputSchema,
  type UpdateTeamOutput,
  type TeamOutput,
} from '../dtos/index.js';

/**
 * Update Team Use Case
 * Updates team details (name, description) - requires admin or owner role
 */
@injectable()
export class UpdateTeamUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    userId: string,
    teamId: string,
    input: UpdateTeamInput
  ): Promise<UpdateTeamOutput> {
    // Validate input
    const validated = UpdateTeamInputSchema.parse(input);

    // Check if there's anything to update
    if (validated.name === undefined && validated.description === undefined) {
      // Nothing to update, just return current team
      const team = await this.getTeamOrThrow(teamId);
      return { team: this.toTeamOutput(team) };
    }

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

    // Only owner or admin can update team
    if (!result.membership.canModifyTeam()) {
      throw new InsufficientPermissionError('update team');
    }

    // Build update
    let updatedTeam = result.team;

    if (validated.name !== undefined) {
      const newName = TeamName.create(validated.name);
      updatedTeam = updatedTeam.updateName(newName);
    }

    if (validated.description !== undefined) {
      updatedTeam = updatedTeam.updateDescription(validated.description);
    }

    // Persist
    const saved = await this.teamRepository.update(updatedTeam);

    return {
      team: this.toTeamOutput(saved),
    };
  }

  private async getTeamOrThrow(teamId: string): Promise<Team> {
    const teamIdVO = TeamId.create(teamId);
    const team = await this.teamRepository.findById(teamIdVO);

    if (team === null) {
      throw new TeamNotFoundError(teamId);
    }

    return team;
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

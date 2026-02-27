import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Team } from '@domain/team/entities/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamName } from '@domain/team/value-objects/index.js';

import {
  type CreateTeamInput,
  CreateTeamInputSchema,
  type CreateTeamOutput,
  type TeamOutput,
} from '../dtos/index.js';

/**
 * Create Team Use Case
 * Creates a new team with the current user as owner
 */
@injectable()
export class CreateTeamUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    userId: string,
    input: CreateTeamInput
  ): Promise<CreateTeamOutput> {
    // Validate input
    const validated = CreateTeamInputSchema.parse(input);

    // Create domain entities
    const ownerId = UserId.create(userId);
    const teamName = TeamName.create(validated.name);

    const team = Team.create({
      name: teamName,
      description: validated.description ?? null,
    });

    // Persist team with owner membership (transactional)
    const createdTeam = await this.teamRepository.create(team, ownerId);

    return {
      team: this.toTeamOutput(createdTeam),
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

import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY_TOKEN,
} from '@domain/project/ports/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';
import { assertTeamMember } from '@shared/auth/team-permission.helper.js';

import { type ProjectDTO, toProjectDTO } from '../dtos/index.js';

/**
 * Options for getting team projects
 */
export interface GetTeamProjectsOptions {
  includeArchived?: boolean;
}

/**
 * Get Team Projects Use Case
 * Retrieves all projects for a team - any team member can view
 */
@injectable()
export class GetTeamProjectsUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    userId: string,
    teamId: string,
    options?: GetTeamProjectsOptions
  ): Promise<ProjectDTO[]> {
    // Create value objects
    const userIdVO = UserId.create(userId);
    const teamIdVO = TeamId.create(teamId);

    // Check user is a team member (any role)
    await assertTeamMember(this.teamRepository, teamIdVO, userIdVO);

    // Find all projects for the team
    const projects = await this.projectRepository.findByTeamId(
      teamIdVO,
      options?.includeArchived ?? false
    );

    return projects.map(toProjectDTO);
  }
}

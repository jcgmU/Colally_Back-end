import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Project, ProjectName } from '@domain/project/index.js';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY_TOKEN,
} from '@domain/project/ports/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';
import { assertTeamAdmin } from '@shared/auth/team-permission.helper.js';

import {
  type CreateProjectInput,
  CreateProjectInputSchema,
  type ProjectDTO,
  toProjectDTO,
} from '../dtos/index.js';

/**
 * Create Project Use Case
 * Creates a new project within a team - requires owner/admin role
 */
@injectable()
export class CreateProjectUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    userId: string,
    teamId: string,
    input: CreateProjectInput
  ): Promise<ProjectDTO> {
    // Validate input
    const validated = CreateProjectInputSchema.parse(input);

    // Create value objects
    const userIdVO = UserId.create(userId);
    const teamIdVO = TeamId.create(teamId);

    // Check user has admin permission (owner or admin)
    await assertTeamAdmin(this.teamRepository, teamIdVO, userIdVO);

    // Get next position for the project
    const position = await this.projectRepository.getNextPosition(teamIdVO);

    // Create project entity
    const project = Project.create({
      teamId: teamIdVO,
      name: ProjectName.create(validated.name),
      description: validated.description ?? null,
      createdBy: userIdVO,
      position,
    });

    // Persist
    await this.projectRepository.save(project);

    return toProjectDTO(project);
  }
}

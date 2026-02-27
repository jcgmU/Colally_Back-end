import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { ProjectId, ProjectNotFoundError } from '@domain/project/index.js';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY_TOKEN,
} from '@domain/project/ports/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { assertTeamMember } from '@shared/auth/team-permission.helper.js';

import { type ProjectDTO, toProjectDTO } from '../dtos/index.js';

/**
 * Get Project Use Case
 * Retrieves a project by ID - any team member can view
 */
@injectable()
export class GetProjectUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(userId: string, projectId: string): Promise<ProjectDTO> {
    // Create value objects
    const userIdVO = UserId.create(userId);
    const projectIdVO = ProjectId.create(projectId);

    // Find project
    const project = await this.projectRepository.findById(projectIdVO);

    if (project === null) {
      throw new ProjectNotFoundError(projectId);
    }

    // Check user is a team member (any role)
    await assertTeamMember(this.teamRepository, project.teamId, userIdVO);

    return toProjectDTO(project);
  }
}

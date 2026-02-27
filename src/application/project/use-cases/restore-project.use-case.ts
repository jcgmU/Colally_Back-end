import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  ProjectId,
  ProjectNotFoundError,
} from '@domain/project/index.js';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY_TOKEN,
} from '@domain/project/ports/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { assertTeamAdmin } from '@shared/auth/team-permission.helper.js';

import {
  type ProjectDTO,
  toProjectDTO,
} from '../dtos/index.js';

/**
 * Restore Project Use Case
 * Restores an archived project - requires owner/admin role
 */
@injectable()
export class RestoreProjectUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(projectId: string, userId: string): Promise<ProjectDTO> {
    // Create value objects
    const projectIdVO = ProjectId.create(projectId);
    const userIdVO = UserId.create(userId);

    // Find project
    const project = await this.projectRepository.findById(projectIdVO);

    if (project === null) {
      throw new ProjectNotFoundError(projectId);
    }

    // Check user has admin permission (owner or admin)
    await assertTeamAdmin(this.teamRepository, project.teamId, userIdVO);

    // Restore project - entity throws ProjectNotArchivedError if not archived
    const restoredProject = project.restore();

    // Get next position for restored project (goes to end of active projects)
    const nextPosition = await this.projectRepository.getNextPosition(project.teamId);

    // Update position to place at end
    const repositionedProject = restoredProject.updatePosition(nextPosition);

    // Persist
    await this.projectRepository.save(repositionedProject);

    return toProjectDTO(repositionedProject);
  }
}

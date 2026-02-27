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
import { assertTeamOwner } from '@shared/auth/team-permission.helper.js';

/**
 * Delete Project Output
 */
export interface DeleteProjectOutput {
  success: boolean;
}

/**
 * Delete Project Use Case
 * Permanently deletes a project - requires owner role ONLY
 */
@injectable()
export class DeleteProjectUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(projectId: string, userId: string): Promise<DeleteProjectOutput> {
    // Create value objects
    const projectIdVO = ProjectId.create(projectId);
    const userIdVO = UserId.create(userId);

    // Find project
    const project = await this.projectRepository.findById(projectIdVO);

    if (project === null) {
      throw new ProjectNotFoundError(projectId);
    }

    // Check user is owner - ONLY owner can delete projects
    await assertTeamOwner(this.teamRepository, project.teamId, userIdVO);

    // Delete project (hard delete)
    await this.projectRepository.delete(projectIdVO);

    return {
      success: true,
    };
  }
}

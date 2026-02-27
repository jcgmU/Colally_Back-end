import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  ProjectId,
  ProjectName,
  ProjectNotFoundError,
  CannotUpdateArchivedProjectError,
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
  type UpdateProjectInput,
  UpdateProjectInputSchema,
  type ProjectDTO,
  toProjectDTO,
} from '../dtos/index.js';

/**
 * Update Project Use Case
 * Updates project details - requires owner/admin role
 */
@injectable()
export class UpdateProjectUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<ProjectDTO> {
    // Validate input
    const validated = UpdateProjectInputSchema.parse(input);

    // Create value objects
    const userIdVO = UserId.create(userId);
    const projectIdVO = ProjectId.create(projectId);

    // Find project
    const project = await this.projectRepository.findById(projectIdVO);

    if (project === null) {
      throw new ProjectNotFoundError(projectId);
    }

    // Check user has admin permission (owner or admin)
    await assertTeamAdmin(this.teamRepository, project.teamId, userIdVO);

    // Check if project is archived (the entity will throw, but we check here for clarity)
    if (project.status.isArchived()) {
      throw new CannotUpdateArchivedProjectError(projectId);
    }

    // Check if there's anything to update
    if (validated.name === undefined && validated.description === undefined) {
      // Nothing to update, return current project
      return toProjectDTO(project);
    }

    // Build update props
    const updateProps: { name?: ProjectName; description?: string | null } = {};

    if (validated.name !== undefined) {
      updateProps.name = ProjectName.create(validated.name);
    }

    if (validated.description !== undefined) {
      updateProps.description = validated.description;
    }

    // Update project
    const updatedProject = project.update(updateProps);

    // Persist
    await this.projectRepository.save(updatedProject);

    return toProjectDTO(updatedProject);
  }
}

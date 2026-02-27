import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  ProjectId,
  ReorderProjectsInvalidError,
} from '@domain/project/index.js';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY_TOKEN,
} from '@domain/project/ports/index.js';
import { TeamId } from '@domain/team/value-objects/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { assertTeamAdmin } from '@shared/auth/team-permission.helper.js';

import {
  type ReorderProjectsInput,
  ReorderProjectsInputSchema,
} from '../dtos/index.js';

/**
 * Reorder Projects Use Case
 * Reorders all active projects in a team - requires owner/admin role
 */
@injectable()
export class ReorderProjectsUseCase {
  constructor(
    @inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(
    teamId: string,
    input: ReorderProjectsInput,
    userId: string
  ): Promise<{ success: true }> {
    // Validate input
    const validated = ReorderProjectsInputSchema.parse(input);

    // Create value objects
    const teamIdVO = TeamId.create(teamId);
    const userIdVO = UserId.create(userId);

    // Check user has admin permission (owner or admin)
    await assertTeamAdmin(this.teamRepository, teamIdVO, userIdVO);

    // Get all active projects for the team
    const activeProjects = await this.projectRepository.findByTeamId(teamIdVO, false);

    // Extract active project IDs
    const activeProjectIds = new Set(activeProjects.map((p) => p.id.value));
    const inputProjectIds = new Set(validated.projectIds);

    // Validate that projectIds contains ALL active project IDs (no missing, no extras)
    const missingIds = [...activeProjectIds].filter((id) => !inputProjectIds.has(id));
    const extraIds = validated.projectIds.filter((id) => !activeProjectIds.has(id));

    if (missingIds.length > 0) {
      throw new ReorderProjectsInvalidError(
        `Missing project IDs: ${missingIds.join(', ')}`
      );
    }

    if (extraIds.length > 0) {
      throw new ReorderProjectsInvalidError(
        `Invalid or non-active project IDs: ${extraIds.join(', ')}`
      );
    }

    // Create position map: each projectId gets position based on its index in the array
    const positionUpdates = validated.projectIds.map((projectId, index) => ({
      id: ProjectId.create(projectId),
      position: index,
    }));

    // Call updatePositions with the new positions
    await this.projectRepository.updatePositions(positionUpdates);

    return { success: true };
  }
}

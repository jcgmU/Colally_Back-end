import { TeamId } from '@domain/team/value-objects/index.js';

import { Project } from '../entities/index.js';
import { ProjectId } from '../value-objects/index.js';

/**
 * IProjectRepository Port
 * Interface for project persistence operations
 */
export interface IProjectRepository {
  /**
   * Save a project (create or update)
   */
  save(project: Project): Promise<void>;

  /**
   * Find a project by its ID
   */
  findById(id: ProjectId): Promise<Project | null>;

  /**
   * Find all projects belonging to a team
   * @param teamId - The team's ID
   * @param includeArchived - Whether to include archived projects (default: false)
   */
  findByTeamId(teamId: TeamId, includeArchived?: boolean): Promise<Project[]>;

  /**
   * Delete a project
   */
  delete(id: ProjectId): Promise<void>;

  /**
   * Get the next position for a new project in a team
   */
  getNextPosition(teamId: TeamId): Promise<number>;

  /**
   * Update positions for multiple projects (for reordering)
   */
  updatePositions(projects: Array<{ id: ProjectId; position: number }>): Promise<void>;
}

/**
 * DI Token for IProjectRepository
 */
export const PROJECT_REPOSITORY_TOKEN = Symbol('IProjectRepository');

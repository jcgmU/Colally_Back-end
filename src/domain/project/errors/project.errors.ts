/**
 * Base class for project domain errors
 */
export abstract class ProjectDomainError extends Error {
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ============================================
// ID Errors
// ============================================

export class InvalidProjectIdError extends ProjectDomainError {
  public readonly code = 'INVALID_PROJECT_ID';

  constructor(value: string) {
    super(`Invalid project ID: ${value}`);
  }
}

// ============================================
// Project Errors
// ============================================

export class ProjectNotFoundError extends ProjectDomainError {
  public readonly code = 'PROJECT_NOT_FOUND';

  constructor(projectId?: string) {
    super(projectId ? `Project not found: ${projectId}` : 'Project not found');
  }
}

export class ProjectNameInvalidError extends ProjectDomainError {
  public readonly code = 'PROJECT_NAME_INVALID';

  constructor(reason: string) {
    super(`Invalid project name: ${reason}`);
  }
}

// ============================================
// Archive/Restore Errors
// ============================================

export class ProjectAlreadyArchivedError extends ProjectDomainError {
  public readonly code = 'PROJECT_ALREADY_ARCHIVED';

  constructor(projectId?: string) {
    super(projectId ? `Project is already archived: ${projectId}` : 'Project is already archived');
  }
}

export class ProjectNotArchivedError extends ProjectDomainError {
  public readonly code = 'PROJECT_NOT_ARCHIVED';

  constructor(projectId?: string) {
    super(projectId ? `Project is not archived: ${projectId}` : 'Project is not archived');
  }
}

export class CannotUpdateArchivedProjectError extends ProjectDomainError {
  public readonly code = 'CANNOT_UPDATE_ARCHIVED_PROJECT';

  constructor(projectId?: string) {
    super(projectId ? `Cannot update archived project: ${projectId}` : 'Cannot update archived project');
  }
}

// ============================================
// Reorder Errors
// ============================================

export class ReorderProjectsInvalidError extends ProjectDomainError {
  public readonly code = 'REORDER_PROJECTS_INVALID';

  constructor(message: string) {
    super(message);
  }
}

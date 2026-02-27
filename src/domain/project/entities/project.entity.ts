import { TeamId } from '@domain/team/value-objects/index.js';
import { UserId } from '@domain/auth/value-objects/index.js';

import { ProjectId, ProjectName, ProjectStatus } from '../value-objects/index.js';
import {
  ProjectAlreadyArchivedError,
  ProjectNotArchivedError,
  CannotUpdateArchivedProjectError,
} from '../errors/index.js';

/**
 * Props for creating a new Project
 */
export interface CreateProjectProps {
  teamId: TeamId;
  name: ProjectName;
  description?: string | null;
  createdBy: UserId;
  position?: number;
}

/**
 * Props for reconstituting a Project from persistence
 */
export interface ReconstituteProjectProps {
  id: ProjectId;
  teamId: TeamId;
  name: ProjectName;
  description: string | null;
  status: ProjectStatus;
  position: number;
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props for updating a Project
 */
export interface UpdateProjectProps {
  name?: ProjectName;
  description?: string | null;
}

/**
 * Project Entity
 * Represents a project within a team
 */
export class Project {
  private constructor(
    private readonly _id: ProjectId,
    private readonly _teamId: TeamId,
    private _name: ProjectName,
    private _description: string | null,
    private _status: ProjectStatus,
    private _position: number,
    private readonly _createdBy: UserId,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Create a new Project
   */
  public static create(props: CreateProjectProps): Project {
    const now = new Date();
    return new Project(
      ProjectId.generate(),
      props.teamId,
      props.name,
      props.description ?? null,
      ProjectStatus.active(),
      props.position ?? 0,
      props.createdBy,
      now,
      now
    );
  }

  /**
   * Reconstitute a Project from persistence
   */
  public static reconstitute(props: ReconstituteProjectProps): Project {
    return new Project(
      props.id,
      props.teamId,
      props.name,
      props.description,
      props.status,
      props.position,
      props.createdBy,
      props.createdAt,
      props.updatedAt
    );
  }

  // Getters
  public get id(): ProjectId {
    return this._id;
  }

  public get teamId(): TeamId {
    return this._teamId;
  }

  public get name(): ProjectName {
    return this._name;
  }

  public get description(): string | null {
    return this._description;
  }

  public get status(): ProjectStatus {
    return this._status;
  }

  public get position(): number {
    return this._position;
  }

  public get createdBy(): UserId {
    return this._createdBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Domain methods

  /**
   * Update project properties (only allowed for active projects)
   */
  public update(props: UpdateProjectProps): Project {
    if (this._status.isArchived()) {
      throw new CannotUpdateArchivedProjectError(this._id.value);
    }

    return new Project(
      this._id,
      this._teamId,
      props.name ?? this._name,
      props.description !== undefined ? props.description : this._description,
      this._status,
      this._position,
      this._createdBy,
      this._createdAt,
      new Date()
    );
  }

  /**
   * Archive the project
   */
  public archive(): Project {
    if (!this._status.canArchive()) {
      throw new ProjectAlreadyArchivedError(this._id.value);
    }

    return new Project(
      this._id,
      this._teamId,
      this._name,
      this._description,
      ProjectStatus.archived(),
      this._position,
      this._createdBy,
      this._createdAt,
      new Date()
    );
  }

  /**
   * Restore the project from archived state
   */
  public restore(): Project {
    if (!this._status.canRestore()) {
      throw new ProjectNotArchivedError(this._id.value);
    }

    return new Project(
      this._id,
      this._teamId,
      this._name,
      this._description,
      ProjectStatus.active(),
      this._position,
      this._createdBy,
      this._createdAt,
      new Date()
    );
  }

  /**
   * Update the project's position
   */
  public updatePosition(position: number): Project {
    return new Project(
      this._id,
      this._teamId,
      this._name,
      this._description,
      this._status,
      position,
      this._createdBy,
      this._createdAt,
      new Date()
    );
  }
}

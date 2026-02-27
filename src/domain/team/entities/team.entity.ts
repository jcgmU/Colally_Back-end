import { TeamId, TeamName } from '../value-objects/index.js';

/**
 * Props for creating a new Team
 */
export interface CreateTeamProps {
  name: TeamName;
  description?: string | null;
}

/**
 * Props for reconstituting a Team from persistence
 */
export interface ReconstituteTeamProps {
  id: TeamId;
  name: TeamName;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team Entity
 * Represents a team/organization that users can belong to
 */
export class Team {
  private constructor(
    private readonly _id: TeamId,
    private _name: TeamName,
    private _description: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Create a new Team
   */
  public static create(props: CreateTeamProps): Team {
    const now = new Date();
    return new Team(
      TeamId.generate(),
      props.name,
      props.description ?? null,
      now,
      now
    );
  }

  /**
   * Reconstitute a Team from persistence
   */
  public static reconstitute(props: ReconstituteTeamProps): Team {
    return new Team(
      props.id,
      props.name,
      props.description,
      props.createdAt,
      props.updatedAt
    );
  }

  // Getters
  public get id(): TeamId {
    return this._id;
  }

  public get name(): TeamName {
    return this._name;
  }

  public get description(): string | null {
    return this._description;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Domain methods
  public updateName(name: TeamName): Team {
    return new Team(
      this._id,
      name,
      this._description,
      this._createdAt,
      new Date()
    );
  }

  public updateDescription(description: string | null): Team {
    return new Team(
      this._id,
      this._name,
      description,
      this._createdAt,
      new Date()
    );
  }

  public update(props: { name?: TeamName; description?: string | null }): Team {
    return new Team(
      this._id,
      props.name ?? this._name,
      props.description !== undefined ? props.description : this._description,
      this._createdAt,
      new Date()
    );
  }
}

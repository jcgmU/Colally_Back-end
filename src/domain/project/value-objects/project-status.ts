/**
 * ProjectStatus Value Object
 * Represents the lifecycle state of a project (active or archived)
 */
export class ProjectStatus {
  public static readonly ACTIVE = 'active';
  public static readonly ARCHIVED = 'archived';

  private static readonly VALID_STATUSES = [
    ProjectStatus.ACTIVE,
    ProjectStatus.ARCHIVED,
  ] as const;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): ProjectStatus {
    const normalized = value.toLowerCase();
    if (!ProjectStatus.VALID_STATUSES.includes(normalized as typeof ProjectStatus.VALID_STATUSES[number])) {
      throw new Error(`Invalid project status: ${value}. Valid statuses are: ${ProjectStatus.VALID_STATUSES.join(', ')}`);
    }
    return new ProjectStatus(normalized);
  }

  public static active(): ProjectStatus {
    return new ProjectStatus(ProjectStatus.ACTIVE);
  }

  public static archived(): ProjectStatus {
    return new ProjectStatus(ProjectStatus.ARCHIVED);
  }

  public get value(): string {
    return this._value;
  }

  public isActive(): boolean {
    return this._value === ProjectStatus.ACTIVE;
  }

  public isArchived(): boolean {
    return this._value === ProjectStatus.ARCHIVED;
  }

  /**
   * Check if the project can be archived (must be active)
   */
  public canArchive(): boolean {
    return this.isActive();
  }

  /**
   * Check if the project can be restored (must be archived)
   */
  public canRestore(): boolean {
    return this.isArchived();
  }

  public equals(other: ProjectStatus): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

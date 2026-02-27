import { ProjectNameInvalidError } from '../errors/index.js';

/**
 * ProjectName Value Object
 * Project name with validation (1-100 characters)
 */
export class ProjectName {
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 100;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): ProjectName {
    const trimmed = value.trim();

    if (trimmed.length < ProjectName.MIN_LENGTH) {
      throw new ProjectNameInvalidError('Project name cannot be empty');
    }

    if (trimmed.length > ProjectName.MAX_LENGTH) {
      throw new ProjectNameInvalidError(
        `Project name must be at most ${ProjectName.MAX_LENGTH} characters`
      );
    }

    return new ProjectName(trimmed);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ProjectName): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

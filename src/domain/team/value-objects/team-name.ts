import { TeamNameInvalidError } from '../errors/index.js';

/**
 * TeamName Value Object
 * Team name with validation (1-100 characters)
 */
export class TeamName {
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 100;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): TeamName {
    const trimmed = value.trim();

    if (trimmed.length < TeamName.MIN_LENGTH) {
      throw new TeamNameInvalidError('Team name cannot be empty');
    }

    if (trimmed.length > TeamName.MAX_LENGTH) {
      throw new TeamNameInvalidError(
        `Team name must be at most ${TeamName.MAX_LENGTH} characters`
      );
    }

    return new TeamName(trimmed);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: TeamName): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

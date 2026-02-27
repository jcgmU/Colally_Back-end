import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { InvalidTeamIdError } from '../errors/index.js';

/**
 * TeamId Value Object
 * UUID-based team identifier
 */
export class TeamId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): TeamId {
    if (value !== undefined) {
      if (!uuidValidate(value)) {
        throw new InvalidTeamIdError(value);
      }
      return new TeamId(value);
    }
    return new TeamId(uuidv4());
  }

  public static generate(): TeamId {
    return new TeamId(uuidv4());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: TeamId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

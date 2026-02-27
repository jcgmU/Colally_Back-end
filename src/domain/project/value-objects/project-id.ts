import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { InvalidProjectIdError } from '../errors/index.js';

/**
 * ProjectId Value Object
 * UUID-based project identifier
 */
export class ProjectId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): ProjectId {
    if (value !== undefined) {
      if (!uuidValidate(value)) {
        throw new InvalidProjectIdError(value);
      }
      return new ProjectId(value);
    }
    return new ProjectId(uuidv4());
  }

  public static generate(): ProjectId {
    return new ProjectId(uuidv4());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ProjectId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

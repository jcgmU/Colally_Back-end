import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { InvalidUserIdError } from '../errors/index.js';

/**
 * UserId Value Object
 * UUID-based user identifier
 */
export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): UserId {
    if (value !== undefined) {
      if (!uuidValidate(value)) {
        throw new InvalidUserIdError(value);
      }
      return new UserId(value);
    }

    return new UserId(uuidv4());
  }

  public static generate(): UserId {
    return new UserId(uuidv4());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: UserId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Base class for UUID-based identifiers
 */
export abstract class EntityId {
  protected readonly _value: string;

  protected constructor(value: string) {
    this._value = value;
  }

  protected static validateUuid(value: string, errorFactory: (value: string) => Error): void {
    if (!uuidValidate(value)) {
      throw errorFactory(value);
    }
  }

  protected static generateUuid(): string {
    return uuidv4();
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: EntityId): boolean {
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

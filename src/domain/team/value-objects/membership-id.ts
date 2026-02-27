import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { InvalidMembershipIdError } from '../errors/index.js';

/**
 * MembershipId Value Object
 * UUID-based membership identifier
 */
export class MembershipId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): MembershipId {
    if (value !== undefined) {
      if (!uuidValidate(value)) {
        throw new InvalidMembershipIdError(value);
      }
      return new MembershipId(value);
    }
    return new MembershipId(uuidv4());
  }

  public static generate(): MembershipId {
    return new MembershipId(uuidv4());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: MembershipId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

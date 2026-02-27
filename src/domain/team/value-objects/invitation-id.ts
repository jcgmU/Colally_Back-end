import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { InvalidInvitationIdError } from '../errors/index.js';

/**
 * InvitationId Value Object
 * UUID-based invitation identifier
 */
export class InvitationId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): InvitationId {
    if (value !== undefined) {
      if (!uuidValidate(value)) {
        throw new InvalidInvitationIdError(value);
      }
      return new InvitationId(value);
    }
    return new InvitationId(uuidv4());
  }

  public static generate(): InvitationId {
    return new InvitationId(uuidv4());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: InvitationId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

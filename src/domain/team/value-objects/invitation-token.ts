import { randomBytes } from 'node:crypto';

import { InvalidInvitationTokenError } from '../errors/index.js';

/**
 * InvitationToken Value Object
 * Secure random token for team invitations (64 hex characters)
 */
export class InvitationToken {
  public static readonly TOKEN_LENGTH = 64; // 32 bytes = 64 hex chars

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static generate(): InvitationToken {
    const token = randomBytes(32).toString('hex');
    return new InvitationToken(token);
  }

  public static create(value: string): InvitationToken {
    if (!InvitationToken.isValid(value)) {
      throw new InvalidInvitationTokenError();
    }
    return new InvitationToken(value);
  }

  private static isValid(value: string): boolean {
    if (value.length !== InvitationToken.TOKEN_LENGTH) {
      return false;
    }
    return /^[a-f0-9]+$/i.test(value);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: InvitationToken): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

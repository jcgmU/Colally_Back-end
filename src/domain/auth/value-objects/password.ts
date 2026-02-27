import { WeakPasswordError } from '../errors/index.js';

/**
 * Password Value Object
 * Validates password strength requirements
 * Note: This stores the plain password temporarily for hashing.
 * Use HashedPassword for stored passwords.
 */
export class Password {
  private readonly _value: string;

  private static readonly MIN_LENGTH = 8;
  private static readonly HAS_UPPERCASE = /[A-Z]/;
  private static readonly HAS_LOWERCASE = /[a-z]/;
  private static readonly HAS_NUMBER = /\d/;
  private static readonly HAS_SPECIAL = /[!@#$%^&*(),.?":{}|<>]/;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): Password {
    if (!Password.isStrong(value)) {
      throw new WeakPasswordError();
    }

    return new Password(value);
  }

  /**
   * Create a Password without validation (for testing or special cases)
   */
  public static createUnsafe(value: string): Password {
    return new Password(value);
  }

  private static isStrong(value: string): boolean {
    if (value.length < Password.MIN_LENGTH) {
      return false;
    }

    if (!Password.HAS_UPPERCASE.test(value)) {
      return false;
    }

    if (!Password.HAS_LOWERCASE.test(value)) {
      return false;
    }

    if (!Password.HAS_NUMBER.test(value)) {
      return false;
    }

    if (!Password.HAS_SPECIAL.test(value)) {
      return false;
    }

    return true;
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    // Never expose password in logs
    return '[REDACTED]';
  }
}

/**
 * HashedPassword Value Object
 * Represents a bcrypt-hashed password
 */
export class HashedPassword {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static fromHash(hash: string): HashedPassword {
    return new HashedPassword(hash);
  }

  public get value(): string {
    return this._value;
  }

  public toString(): string {
    return '[HASHED]';
  }
}

import { InvalidEmailError } from '../errors/index.js';

/**
 * Email Value Object
 * Immutable, validated email address
 */
export class Email {
  private readonly _value: string;

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    this._value = value.toLowerCase().trim();
  }

  public static create(value: string): Email {
    const normalized = value.toLowerCase().trim();

    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailError(value);
    }

    return new Email(normalized);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

import { InvalidAvatarUrlError } from '../errors/index.js';

/**
 * AvatarUrl Value Object
 * Optional HTTPS URL for user avatars
 */
export class AvatarUrl {
  public static readonly MAX_LENGTH = 500;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string | null | undefined): AvatarUrl | null {
    if (value === null || value === undefined || value.trim() === '') {
      return null;
    }

    const trimmed = value.trim();

    if (trimmed.length > AvatarUrl.MAX_LENGTH) {
      throw new InvalidAvatarUrlError(`Avatar URL must be at most ${AvatarUrl.MAX_LENGTH} characters`);
    }

    if (!AvatarUrl.isValidUrl(trimmed)) {
      throw new InvalidAvatarUrlError('Avatar URL must be a valid HTTPS URL');
    }

    return new AvatarUrl(trimmed);
  }

  private static isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: AvatarUrl | null): boolean {
    if (other === null) {
      return false;
    }
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

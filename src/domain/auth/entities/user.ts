import { AvatarUrl } from '@domain/team/value-objects/index.js';

import { Email, HashedPassword, UserId } from '../value-objects/index.js';

export interface UserProps {
  id: UserId;
  email: Email;
  password: HashedPassword;
  name: string;
  avatarUrl: AvatarUrl | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface CreateUserProps {
  email: Email;
  password: HashedPassword;
  name: string;
}

/**
 * User Domain Entity
 * Core business entity representing a user in the system
 */
export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  /**
   * Create a new User (for registration)
   */
  public static create(props: CreateUserProps): User {
    const now = new Date();

    return new User({
      id: UserId.generate(),
      email: props.email,
      password: props.password,
      name: props.name.trim(),
      avatarUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a User from persistence
   */
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  public get id(): UserId {
    return this.props.id;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get password(): HashedPassword {
    return this.props.password;
  }

  public get name(): string {
    return this.props.name;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get avatarUrl(): AvatarUrl | null {
    return this.props.avatarUrl;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get passwordResetToken(): string | undefined {
    return this.props.passwordResetToken;
  }

  public get passwordResetExpires(): Date | undefined {
    return this.props.passwordResetExpires;
  }

  // Domain methods
  public updatePassword(newPassword: HashedPassword): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
    this.clearPasswordReset();
  }

  public updateName(newName: string): void {
    this.props.name = newName.trim();
    this.props.updatedAt = new Date();
  }

  public updateAvatarUrl(avatarUrl: AvatarUrl | null): void {
    this.props.avatarUrl = avatarUrl;
    this.props.updatedAt = new Date();
  }

  public updateProfile(name?: string, avatarUrl?: AvatarUrl | null): void {
    if (name !== undefined) {
      this.props.name = name.trim();
    }
    if (avatarUrl !== undefined) {
      this.props.avatarUrl = avatarUrl;
    }
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public setPasswordResetToken(token: string, expiresAt: Date): void {
    this.props.passwordResetToken = token;
    this.props.passwordResetExpires = expiresAt;
    this.props.updatedAt = new Date();
  }

  public clearPasswordReset(): void {
    this.props.passwordResetToken = undefined;
    this.props.passwordResetExpires = undefined;
  }

  public isPasswordResetValid(token: string): boolean {
    if (this.props.passwordResetToken === undefined || this.props.passwordResetExpires === undefined) {
      return false;
    }

    if (this.props.passwordResetToken !== token) {
      return false;
    }

    return this.props.passwordResetExpires > new Date();
  }

  public canLogin(): boolean {
    return this.props.isActive;
  }

  /**
   * Convert to plain object for persistence
   */
  public toPersistence(): {
    id: string;
    email: string;
    password: string;
    name: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
  } {
    return {
      id: this.props.id.value,
      email: this.props.email.value,
      password: this.props.password.value,
      name: this.props.name,
      avatarUrl: this.props.avatarUrl?.value ?? null,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      passwordResetToken: this.props.passwordResetToken ?? null,
      passwordResetExpires: this.props.passwordResetExpires ?? null,
    };
  }
}

import { AvatarUrl } from '@domain/team/value-objects/index.js';

import { User } from '../entities/user.js';
import { Email, UserId } from '../value-objects/index.js';

/**
 * Profile update data
 */
export interface UpdateProfileData {
  name?: string;
  avatarUrl?: AvatarUrl | null;
}

/**
 * User Repository Port
 * Defines the interface for user persistence operations
 */
export interface IUserRepository {
  /**
   * Find a user by their ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find a user by their email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Check if a user with the given email exists
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Save a new user or update an existing one
   */
  save(user: User): Promise<void>;

  /**
   * Update user profile (name and/or avatar)
   */
  updateProfile(id: UserId, data: UpdateProfileData): Promise<User>;

  /**
   * Delete a user by their ID
   */
  delete(id: UserId): Promise<void>;

  /**
   * Find a user by password reset token
   */
  findByPasswordResetToken(token: string): Promise<User | null>;
}

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');

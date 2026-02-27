import { inject, injectable } from 'tsyringe';

import { User } from '@domain/auth/entities/index.js';
import { UserNotFoundError } from '@domain/auth/errors/index.js';
import { type IUserRepository, USER_REPOSITORY_TOKEN } from '@domain/auth/ports/index.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import { AvatarUrl } from '@domain/team/value-objects/index.js';

import {
  type UpdateProfileInput,
  UpdateProfileInputSchema,
  type UpdateProfileOutput,
  type UserOutput,
} from '../dtos/index.js';

/**
 * Update My Profile Use Case
 * Allows authenticated user to update their name and avatar
 */
@injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository
  ) {}

  public async execute(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UpdateProfileOutput> {
    // Validate input
    const validated = UpdateProfileInputSchema.parse(input);

    // Check if there's anything to update
    if (validated.name === undefined && validated.avatarUrl === undefined) {
      // Nothing to update, just return current user
      const user = await this.getCurrentUser(userId);
      return { user: this.toUserOutput(user) };
    }

    const id = UserId.create(userId);

    // Build update data
    const updateData: { name?: string; avatarUrl?: AvatarUrl | null } = {};

    if (validated.name !== undefined) {
      updateData.name = validated.name;
    }

    if (validated.avatarUrl !== undefined) {
      // validated.avatarUrl can be null (to clear) or string (to set)
      updateData.avatarUrl =
        validated.avatarUrl === null ? null : AvatarUrl.create(validated.avatarUrl);
    }

    // Update profile
    const updatedUser = await this.userRepository.updateProfile(id, updateData);

    return {
      user: this.toUserOutput(updatedUser),
    };
  }

  private async getCurrentUser(userId: string): Promise<User> {
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);

    if (user === null) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }

  private toUserOutput(user: User): UserOutput {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      avatarUrl: user.avatarUrl?.value ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

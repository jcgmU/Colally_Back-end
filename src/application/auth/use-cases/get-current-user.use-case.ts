import { inject, injectable } from 'tsyringe';

import { UserNotFoundError } from '@domain/auth/errors/index.js';
import { type IUserRepository, USER_REPOSITORY_TOKEN } from '@domain/auth/ports/index.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import { User } from '@domain/auth/entities/index.js';

import { type GetCurrentUserOutput, type UserOutput } from '../dtos/index.js';

/**
 * Get Current User Use Case
 * Retrieves the currently authenticated user by ID
 */
@injectable()
export class GetCurrentUserUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository
  ) {}

  public async execute(userId: string): Promise<GetCurrentUserOutput> {
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);

    if (user === null) {
      throw new UserNotFoundError(userId);
    }

    return {
      user: this.toUserOutput(user),
    };
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

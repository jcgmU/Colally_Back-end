import { inject, injectable } from 'tsyringe';

import { UserAlreadyExistsError } from '@domain/auth/errors/index.js';
import { User } from '@domain/auth/entities/index.js';
import {
  type IUserRepository,
  USER_REPOSITORY_TOKEN,
  type IPasswordHasher,
  PASSWORD_HASHER_TOKEN,
  type ITokenService,
  TOKEN_SERVICE_TOKEN,
  type IRefreshTokenStorage,
  REFRESH_TOKEN_STORAGE_TOKEN,
} from '@domain/auth/ports/index.js';
import { Email, Password } from '@domain/auth/value-objects/index.js';
import { parseTtlToSeconds, getEnv } from '@config/env.js';

import {
  type RegisterUserInput,
  RegisterUserInputSchema,
  type RegisterUserOutput,
  type UserOutput,
} from '../dtos/index.js';

/**
 * Register User Use Case
 * Creates a new user account and returns tokens
 */
@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: IPasswordHasher,
    @inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService,
    @inject(REFRESH_TOKEN_STORAGE_TOKEN)
    private readonly refreshTokenStorage: IRefreshTokenStorage
  ) {}

  public async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // Validate input
    const validatedInput = RegisterUserInputSchema.parse(input);

    // Create value objects
    const email = Email.create(validatedInput.email);
    const password = Password.create(validatedInput.password);

    // Check if user already exists
    const existingUser = await this.userRepository.existsByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError(email.value);
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(password);

    // Create user entity
    const user = User.create({
      email,
      password: hashedPassword,
      name: validatedInput.name,
    });

    // Save user
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair(user.id, user.email.value);

    // Store refresh token in Redis
    const env = getEnv();
    const ttl = parseTtlToSeconds(env.JWT_REFRESH_TOKEN_TTL);
    await this.refreshTokenStorage.store(user.id, tokens.refreshToken, ttl);

    // Return result
    return {
      user: this.toUserOutput(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  private toUserOutput(user: User): UserOutput {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

import { inject, injectable } from 'tsyringe';

import { InvalidCredentialsError, UserInactiveError } from '@domain/auth/errors/index.js';
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
import { User } from '@domain/auth/entities/index.js';
import { parseTtlToSeconds, getEnv } from '@config/env.js';

import {
  type LoginUserInput,
  LoginUserInputSchema,
  type LoginUserOutput,
  type UserOutput,
} from '../dtos/index.js';

/**
 * Login User Use Case
 * Authenticates a user and returns tokens
 */
@injectable()
export class LoginUserUseCase {
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

  public async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // Validate input
    const validatedInput = LoginUserInputSchema.parse(input);

    // Create value objects
    const email = Email.create(validatedInput.email);
    const password = Password.createUnsafe(validatedInput.password); // No strength check for login

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (user === null) {
      throw new InvalidCredentialsError();
    }

    // Check if user is active
    if (!user.canLogin()) {
      throw new UserInactiveError();
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.verify(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

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
      avatarUrl: user.avatarUrl?.value ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

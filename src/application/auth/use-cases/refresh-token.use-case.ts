import { inject, injectable } from 'tsyringe';

import {
  InvalidTokenError,
  UserNotFoundError,
  UserInactiveError,
} from '@domain/auth/errors/index.js';
import {
  type IUserRepository,
  USER_REPOSITORY_TOKEN,
  type ITokenService,
  TOKEN_SERVICE_TOKEN,
  type IRefreshTokenStorage,
  REFRESH_TOKEN_STORAGE_TOKEN,
} from '@domain/auth/ports/index.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import { parseTtlToSeconds, getEnv } from '@config/env.js';

import {
  type RefreshTokenInput,
  RefreshTokenInputSchema,
  type RefreshTokenOutput,
} from '../dtos/index.js';

/**
 * Refresh Token Use Case
 * Validates refresh token and issues new token pair (with rotation)
 */
@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService,
    @inject(REFRESH_TOKEN_STORAGE_TOKEN)
    private readonly refreshTokenStorage: IRefreshTokenStorage
  ) {}

  public async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // Validate input
    const validatedInput = RefreshTokenInputSchema.parse(input);

    // Verify refresh token
    const payload = this.tokenService.verifyRefreshToken(validatedInput.refreshToken);

    // Check if user exists
    const userId = UserId.create(payload.userId);
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      throw new UserNotFoundError(payload.userId);
    }

    // Check if user is active
    if (!user.canLogin()) {
      throw new UserInactiveError();
    }

    // Check if refresh token is stored (not revoked)
    const tokenExists = await this.refreshTokenStorage.exists(userId, validatedInput.refreshToken);
    if (!tokenExists) {
      throw new InvalidTokenError('Refresh token has been revoked');
    }

    // Revoke old refresh token (rotation)
    await this.refreshTokenStorage.revoke(userId, validatedInput.refreshToken);

    // Generate new token pair
    const tokens = this.tokenService.generateTokenPair(user.id, user.email.value);

    // Store new refresh token
    const env = getEnv();
    const ttl = parseTtlToSeconds(env.JWT_REFRESH_TOKEN_TTL);
    await this.refreshTokenStorage.store(user.id, tokens.refreshToken, ttl);

    return {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}

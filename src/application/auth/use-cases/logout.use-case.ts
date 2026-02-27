import { inject, injectable } from 'tsyringe';

import {
  type ITokenService,
  TOKEN_SERVICE_TOKEN,
  type IRefreshTokenStorage,
  REFRESH_TOKEN_STORAGE_TOKEN,
} from '@domain/auth/ports/index.js';
import { UserId } from '@domain/auth/value-objects/index.js';

import { type LogoutInput, LogoutInputSchema, type LogoutOutput } from '../dtos/index.js';

/**
 * Logout Use Case
 * Revokes refresh tokens (single or all)
 */
@injectable()
export class LogoutUseCase {
  constructor(
    @inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService,
    @inject(REFRESH_TOKEN_STORAGE_TOKEN)
    private readonly refreshTokenStorage: IRefreshTokenStorage
  ) {}

  public async execute(input: LogoutInput): Promise<LogoutOutput> {
    // Validate input
    const validatedInput = LogoutInputSchema.parse(input);

    // Verify refresh token to get user ID
    const payload = this.tokenService.verifyRefreshToken(validatedInput.refreshToken);
    const userId = UserId.create(payload.userId);

    if (validatedInput.logoutAll === true) {
      // Revoke all refresh tokens for this user
      await this.refreshTokenStorage.revokeAll(userId);
    } else {
      // Revoke only the provided refresh token
      await this.refreshTokenStorage.revoke(userId, validatedInput.refreshToken);
    }

    return { success: true };
  }
}

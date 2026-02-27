import jwt from 'jsonwebtoken';
import { injectable } from 'tsyringe';

import { getEnv, parseTtlToSeconds } from '@config/env.js';
import { InvalidTokenError, TokenExpiredError } from '@domain/auth/errors/index.js';
import type {
  ITokenService,
  TokenPayload,
  TokenPair,
} from '@domain/auth/ports/token-service.port.js';
import { UserId } from '@domain/auth/value-objects/index.js';

/**
 * JWT Token Service Implementation
 */
@injectable()
export class JwtTokenService implements ITokenService {
  public generateAccessToken(userId: UserId, email: string): string {
    const env = getEnv();
    const ttlSeconds = parseTtlToSeconds(env.JWT_ACCESS_TOKEN_TTL);

    return jwt.sign(
      {
        userId: userId.value,
        email,
        type: 'access' as const,
      },
      env.JWT_SECRET,
      {
        expiresIn: ttlSeconds,
        algorithm: 'HS256',
      }
    );
  }

  public generateRefreshToken(userId: UserId, email: string): string {
    const env = getEnv();
    const ttlSeconds = parseTtlToSeconds(env.JWT_REFRESH_TOKEN_TTL);

    return jwt.sign(
      {
        userId: userId.value,
        email,
        type: 'refresh' as const,
      },
      env.JWT_SECRET,
      {
        expiresIn: ttlSeconds,
        algorithm: 'HS256',
      }
    );
  }

  public generateTokenPair(userId: UserId, email: string): TokenPair {
    return {
      accessToken: this.generateAccessToken(userId, email),
      refreshToken: this.generateRefreshToken(userId, email),
    };
  }

  public verifyAccessToken(token: string): TokenPayload {
    return this.verifyToken(token, 'access');
  }

  public verifyRefreshToken(token: string): TokenPayload {
    return this.verifyToken(token, 'refresh');
  }

  private verifyToken(token: string, expectedType: 'access' | 'refresh'): TokenPayload {
    const env = getEnv();

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as TokenPayload & { exp?: number };

      if (decoded.type !== expectedType) {
        throw new InvalidTokenError(`Expected ${expectedType} token, got ${decoded.type}`);
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        type: decoded.type,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError(error.message);
      }
      if (error instanceof InvalidTokenError || error instanceof TokenExpiredError) {
        throw error;
      }
      throw new InvalidTokenError('Unknown token error');
    }
  }
}

import 'reflect-metadata';
import { container } from 'tsyringe';

// Infrastructure
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';
import { RedisService, REDIS_SERVICE_TOKEN } from '@infrastructure/redis/index.js';
import {
  BcryptPasswordHasher,
  JwtTokenService,
  RedisRefreshTokenStorage,
} from '@infrastructure/services/index.js';

// Domain Ports
import {
  USER_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_SERVICE_TOKEN,
  REFRESH_TOKEN_STORAGE_TOKEN,
} from '@domain/auth/ports/index.js';
import { TEAM_REPOSITORY_TOKEN } from '@domain/team/ports/team-repository.port.js';
import { TEAM_INVITATION_REPOSITORY_TOKEN } from '@domain/team/ports/team-invitation-repository.port.js';

// Adapters
import {
  PrismaUserRepository,
  PrismaTeamRepository,
  PrismaTeamInvitationRepository,
} from '@adapters/repositories/index.js';

/**
 * Configure the DI container
 * Registers all dependencies
 */
export function configureDI(): void {
  // Infrastructure Services (singletons)
  container.registerSingleton(DATABASE_SERVICE_TOKEN, DatabaseService);
  container.registerSingleton(REDIS_SERVICE_TOKEN, RedisService);

  // Domain Services (singletons)
  container.registerSingleton(PASSWORD_HASHER_TOKEN, BcryptPasswordHasher);
  container.registerSingleton(TOKEN_SERVICE_TOKEN, JwtTokenService);
  container.registerSingleton(REFRESH_TOKEN_STORAGE_TOKEN, RedisRefreshTokenStorage);

  // Repositories (singletons)
  container.registerSingleton(USER_REPOSITORY_TOKEN, PrismaUserRepository);
  container.registerSingleton(TEAM_REPOSITORY_TOKEN, PrismaTeamRepository);
  container.registerSingleton(TEAM_INVITATION_REPOSITORY_TOKEN, PrismaTeamInvitationRepository);
}

/**
 * Get a service from the container
 */
export function getService<T>(token: symbol): T {
  return container.resolve<T>(token);
}

export { container };

/**
 * Mock factories for domain ports
 * Uses vitest-mock-extended for type-safe mocking
 */
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
import { beforeEach } from 'vitest';

import type { IUserRepository } from '@domain/auth/ports/user-repository.port.js';
import type { IPasswordHasher } from '@domain/auth/ports/password-hasher.port.js';
import type { ITokenService } from '@domain/auth/ports/token-service.port.js';
import type { IRefreshTokenStorage } from '@domain/auth/ports/refresh-token-storage.port.js';
import type { ITeamRepository } from '@domain/team/ports/team-repository.port.js';
import type { ITeamInvitationRepository } from '@domain/team/ports/team-invitation-repository.port.js';

// ============================================
// Auth Mocks
// ============================================
export const mockUserRepository = mockDeep<IUserRepository>();
export const mockPasswordHasher = mockDeep<IPasswordHasher>();
export const mockTokenService = mockDeep<ITokenService>();
export const mockRefreshTokenStorage = mockDeep<IRefreshTokenStorage>();

// ============================================
// Team Mocks
// ============================================
export const mockTeamRepository = mockDeep<ITeamRepository>();
export const mockTeamInvitationRepository = mockDeep<ITeamInvitationRepository>();

// ============================================
// Export types for use in tests
// ============================================
export type MockUserRepository = DeepMockProxy<IUserRepository>;
export type MockPasswordHasher = DeepMockProxy<IPasswordHasher>;
export type MockTokenService = DeepMockProxy<ITokenService>;
export type MockRefreshTokenStorage = DeepMockProxy<IRefreshTokenStorage>;
export type MockTeamRepository = DeepMockProxy<ITeamRepository>;
export type MockTeamInvitationRepository = DeepMockProxy<ITeamInvitationRepository>;

/**
 * Reset all mocks before each test
 * Call this in beforeEach()
 */
export function resetAllMocks(): void {
  mockReset(mockUserRepository);
  mockReset(mockPasswordHasher);
  mockReset(mockTokenService);
  mockReset(mockRefreshTokenStorage);
  mockReset(mockTeamRepository);
  mockReset(mockTeamInvitationRepository);
}

/**
 * Setup hook to reset all mocks before each test
 */
export function setupMockReset(): void {
  beforeEach(() => {
    resetAllMocks();
  });
}

/**
 * Team factory for creating test fixtures
 */
import { Team, TeamMembership, TeamInvitation } from '@domain/team/entities/index.js';
import {
  TeamId,
  TeamName,
  TeamRole,
  MembershipId,
  InvitationId,
  InvitationToken,
  InvitationStatus,
} from '@domain/team/value-objects/index.js';
import { UserId, Email } from '@domain/auth/value-objects/index.js';

// ============================================
// Team Factory
// ============================================

export interface CreateTestTeamOptions {
  id?: string;
  name?: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a test Team entity with optional overrides
 */
export function createTestTeam(options: CreateTestTeamOptions = {}): Team {
  const now = new Date();

  return Team.reconstitute({
    id: TeamId.create(options.id ?? '660e8400-e29b-41d4-a716-446655440001'),
    name: TeamName.create(options.name ?? 'Test Team'),
    description: options.description ?? 'A test team description',
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  });
}

/**
 * Create a test Team with random values
 */
export function createRandomTestTeam(overrides: Partial<CreateTestTeamOptions> = {}): Team {
  const randomId = crypto.randomUUID();
  const randomName = `Team ${randomId.slice(0, 8)}`;

  return createTestTeam({
    id: randomId,
    name: randomName,
    ...overrides,
  });
}

// ============================================
// TeamMembership Factory
// ============================================

export interface CreateTestMembershipOptions {
  id?: string;
  userId?: string;
  teamId?: string;
  role?: 'owner' | 'admin' | 'member';
  joinedAt?: Date;
}

/**
 * Create a test TeamMembership entity with optional overrides
 */
export function createTestMembership(options: CreateTestMembershipOptions = {}): TeamMembership {
  return TeamMembership.reconstitute({
    id: MembershipId.create(options.id ?? '770e8400-e29b-41d4-a716-446655440001'),
    userId: UserId.create(options.userId ?? '550e8400-e29b-41d4-a716-446655440000'),
    teamId: TeamId.create(options.teamId ?? '660e8400-e29b-41d4-a716-446655440001'),
    role: TeamRole.create(options.role ?? 'member'),
    joinedAt: options.joinedAt ?? new Date(),
  });
}

/**
 * Create an owner membership
 */
export function createOwnerMembership(
  userId: string,
  teamId: string,
  overrides: Partial<CreateTestMembershipOptions> = {}
): TeamMembership {
  return createTestMembership({
    userId,
    teamId,
    role: 'owner',
    ...overrides,
  });
}

/**
 * Create an admin membership
 */
export function createAdminMembership(
  userId: string,
  teamId: string,
  overrides: Partial<CreateTestMembershipOptions> = {}
): TeamMembership {
  return createTestMembership({
    userId,
    teamId,
    role: 'admin',
    ...overrides,
  });
}

/**
 * Create a member membership
 */
export function createMemberMembership(
  userId: string,
  teamId: string,
  overrides: Partial<CreateTestMembershipOptions> = {}
): TeamMembership {
  return createTestMembership({
    userId,
    teamId,
    role: 'member',
    ...overrides,
  });
}

// ============================================
// TeamInvitation Factory
// ============================================

export interface CreateTestInvitationOptions {
  id?: string;
  teamId?: string;
  email?: string;
  role?: 'admin' | 'member';
  token?: string;
  invitedBy?: string;
  expiresAt?: Date;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt?: Date;
}

/**
 * Generate a valid 64-char hex token for testing
 */
function generateTestToken(): string {
  // Generate 64 hex characters (32 bytes represented as hex)
  const chars = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Default test token (64 hex chars) - used by generateTestToken as fallback
const DEFAULT_TEST_TOKEN = 'a'.repeat(64);
void DEFAULT_TEST_TOKEN; // Suppress unused variable warning

/**
 * Create a test TeamInvitation entity with optional overrides
 */
export function createTestInvitation(options: CreateTestInvitationOptions = {}): TeamInvitation {
  const now = new Date();
  const defaultExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return TeamInvitation.reconstitute({
    id: InvitationId.create(options.id ?? '880e8400-e29b-41d4-a716-446655440001'),
    teamId: TeamId.create(options.teamId ?? '660e8400-e29b-41d4-a716-446655440001'),
    email: Email.create(options.email ?? 'invited@example.com'),
    role: TeamRole.create(options.role ?? 'member'),
    token: InvitationToken.create(options.token ?? generateTestToken()),
    invitedBy: UserId.create(options.invitedBy ?? '550e8400-e29b-41d4-a716-446655440000'),
    expiresAt: options.expiresAt ?? defaultExpiry,
    status: InvitationStatus.create(options.status ?? 'pending'),
    createdAt: options.createdAt ?? now,
  });
}

/**
 * Create an expired invitation
 */
export function createExpiredInvitation(
  overrides: Partial<CreateTestInvitationOptions> = {}
): TeamInvitation {
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

  return createTestInvitation({
    expiresAt: pastDate,
    ...overrides,
  });
}

/**
 * Create a pending invitation for a specific email
 */
export function createPendingInvitation(
  email: string,
  teamId: string,
  overrides: Partial<CreateTestInvitationOptions> = {}
): TeamInvitation {
  return createTestInvitation({
    email,
    teamId,
    status: 'pending',
    ...overrides,
  });
}

// ============================================
// Test IDs
// ============================================

export const TEST_IDS = {
  user1: '550e8400-e29b-41d4-a716-446655440000',
  user2: '550e8400-e29b-41d4-a716-446655440001',
  user3: '550e8400-e29b-41d4-a716-446655440002',
  team1: '660e8400-e29b-41d4-a716-446655440001',
  team2: '660e8400-e29b-41d4-a716-446655440002',
  membership1: '770e8400-e29b-41d4-a716-446655440001',
  membership2: '770e8400-e29b-41d4-a716-446655440002',
  invitation1: '880e8400-e29b-41d4-a716-446655440001',
  invitation2: '880e8400-e29b-41d4-a716-446655440002',
};

import { UserId } from '@domain/auth/value-objects/index.js';

import { Team, TeamMembership } from '../entities/index.js';
import { TeamId, TeamRole } from '../value-objects/index.js';

/**
 * Team with the requesting user's role
 */
export interface TeamWithRole {
  team: Team;
  role: TeamRole;
}

/**
 * Team with the requesting user's membership (if any)
 */
export interface TeamWithMembership {
  team: Team;
  membership: TeamMembership | null;
}

/**
 * Membership with user data for listing
 */
export interface MembershipWithUser {
  membership: TeamMembership;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

/**
 * ITeamRepository Port
 * Interface for team persistence operations
 */
export interface ITeamRepository {
  // Team CRUD
  create(team: Team, ownerId: UserId): Promise<Team>;
  findById(id: TeamId): Promise<Team | null>;
  findByIdWithMembership(id: TeamId, userId: UserId): Promise<TeamWithMembership | null>;
  update(team: Team): Promise<Team>;
  delete(id: TeamId): Promise<void>;

  // User's teams
  findByUserId(userId: UserId): Promise<TeamWithRole[]>;

  // Memberships
  getMemberships(teamId: TeamId): Promise<MembershipWithUser[]>;
  getMembership(teamId: TeamId, userId: UserId): Promise<TeamMembership | null>;
  addMembership(membership: TeamMembership): Promise<TeamMembership>;
  updateMembership(membership: TeamMembership): Promise<TeamMembership>;
  removeMembership(teamId: TeamId, userId: UserId): Promise<void>;
  countMembers(teamId: TeamId): Promise<number>;

  // Checks
  isMember(teamId: TeamId, userId: UserId): Promise<boolean>;
  isEmailMember(teamId: TeamId, email: string): Promise<boolean>;
}

/**
 * DI Token for ITeamRepository
 */
export const TEAM_REPOSITORY_TOKEN = Symbol('ITeamRepository');

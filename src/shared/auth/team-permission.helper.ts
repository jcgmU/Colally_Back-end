import { UserId } from '@domain/auth/value-objects/index.js';
import { ITeamRepository } from '@domain/team/ports/index.js';
import { TeamId, TeamRole } from '@domain/team/value-objects/index.js';

import { DomainError } from '../errors/index.js';

/**
 * Error thrown when user is not a member of the team
 */
export class NotTeamMemberError extends DomainError {
  constructor(teamId: string) {
    super(`User is not a member of team ${teamId}`, 'NOT_MEMBER');
  }
}

/**
 * Error thrown when user doesn't have sufficient permission
 */
export class InsufficientTeamPermissionError extends DomainError {
  constructor(required: string[], actual: string) {
    super(
      `Insufficient permission. Required: ${required.join(' or ')}. Actual: ${actual}`,
      'INSUFFICIENT_PERMISSION'
    );
  }
}

/**
 * Check if user has any of the required roles in the team
 * @throws NotTeamMemberError if user is not a team member
 * @throws InsufficientTeamPermissionError if user doesn't have required role
 */
export async function assertTeamPermission(
  teamRepository: ITeamRepository,
  teamId: TeamId,
  userId: UserId,
  requiredRoles: ('owner' | 'admin' | 'member')[]
): Promise<TeamRole> {
  const membership = await teamRepository.getMembership(teamId, userId);

  if (!membership) {
    throw new NotTeamMemberError(teamId.value);
  }

  const role = membership.role;

  if (!requiredRoles.includes(role.value as 'owner' | 'admin' | 'member')) {
    throw new InsufficientTeamPermissionError(requiredRoles, role.value);
  }

  return role;
}

/**
 * Check if user is at least a member of the team (any role)
 * @throws NotTeamMemberError if user is not a team member
 */
export async function assertTeamMember(
  teamRepository: ITeamRepository,
  teamId: TeamId,
  userId: UserId
): Promise<TeamRole> {
  return assertTeamPermission(teamRepository, teamId, userId, ['owner', 'admin', 'member']);
}

/**
 * Check if user is owner or admin
 * @throws NotTeamMemberError if user is not a team member
 * @throws InsufficientTeamPermissionError if user is only a member
 */
export async function assertTeamAdmin(
  teamRepository: ITeamRepository,
  teamId: TeamId,
  userId: UserId
): Promise<TeamRole> {
  return assertTeamPermission(teamRepository, teamId, userId, ['owner', 'admin']);
}

/**
 * Check if user is owner only
 * @throws NotTeamMemberError if user is not a team member
 * @throws InsufficientTeamPermissionError if user is not owner
 */
export async function assertTeamOwner(
  teamRepository: ITeamRepository,
  teamId: TeamId,
  userId: UserId
): Promise<TeamRole> {
  return assertTeamPermission(teamRepository, teamId, userId, ['owner']);
}

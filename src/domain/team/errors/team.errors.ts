/**
 * Base class for team domain errors
 */
export abstract class TeamDomainError extends Error {
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ============================================
// ID Errors
// ============================================

export class InvalidTeamIdError extends TeamDomainError {
  public readonly code = 'INVALID_TEAM_ID';

  constructor(value: string) {
    super(`Invalid team ID: ${value}`);
  }
}

export class InvalidMembershipIdError extends TeamDomainError {
  public readonly code = 'INVALID_MEMBERSHIP_ID';

  constructor(value: string) {
    super(`Invalid membership ID: ${value}`);
  }
}

export class InvalidInvitationIdError extends TeamDomainError {
  public readonly code = 'INVALID_INVITATION_ID';

  constructor(value: string) {
    super(`Invalid invitation ID: ${value}`);
  }
}

// ============================================
// Team Errors
// ============================================

export class TeamNotFoundError extends TeamDomainError {
  public readonly code = 'TEAM_NOT_FOUND';

  constructor(teamId?: string) {
    super(teamId ? `Team not found: ${teamId}` : 'Team not found');
  }
}

export class TeamNameInvalidError extends TeamDomainError {
  public readonly code = 'TEAM_NAME_INVALID';

  constructor(reason: string) {
    super(`Invalid team name: ${reason}`);
  }
}

// ============================================
// Role Errors
// ============================================

export class InvalidTeamRoleError extends TeamDomainError {
  public readonly code = 'INVALID_TEAM_ROLE';

  constructor(value: string) {
    super(`Invalid team role: ${value}. Valid roles are: owner, admin, member`);
  }
}

export class InsufficientPermissionError extends TeamDomainError {
  public readonly code = 'INSUFFICIENT_PERMISSION';

  constructor(action?: string) {
    super(action ? `Insufficient permission to ${action}` : 'Insufficient permission');
  }
}

// ============================================
// Membership Errors
// ============================================

export class AlreadyMemberError extends TeamDomainError {
  public readonly code = 'ALREADY_MEMBER';

  constructor(email?: string) {
    super(email ? `User ${email} is already a member of this team` : 'User is already a member of this team');
  }
}

export class NotMemberError extends TeamDomainError {
  public readonly code = 'NOT_MEMBER';

  constructor() {
    super('User is not a member of this team');
  }
}

export class CannotRemoveOwnerError extends TeamDomainError {
  public readonly code = 'CANNOT_REMOVE_OWNER';

  constructor() {
    super('Cannot remove the team owner');
  }
}

export class OwnerCannotLeaveError extends TeamDomainError {
  public readonly code = 'OWNER_CANNOT_LEAVE';

  constructor() {
    super('Owner cannot leave the team. Transfer ownership first or delete the team.');
  }
}

export class MustTransferOwnershipError extends TeamDomainError {
  public readonly code = 'MUST_TRANSFER_OWNERSHIP';

  constructor() {
    super('Must transfer ownership to another member before leaving or changing role');
  }
}

export class CannotDemoteOwnerError extends TeamDomainError {
  public readonly code = 'CANNOT_DEMOTE_OWNER';

  constructor() {
    super('Cannot demote the owner. Transfer ownership first.');
  }
}

// ============================================
// Invitation Errors
// ============================================

export class InvalidInvitationTokenError extends TeamDomainError {
  public readonly code = 'INVALID_INVITATION_TOKEN';

  constructor() {
    super('Invalid invitation token');
  }
}

export class InvalidInvitationStatusError extends TeamDomainError {
  public readonly code = 'INVALID_INVITATION_STATUS';

  constructor(value: string) {
    super(`Invalid invitation status: ${value}`);
  }
}

export class InvitationNotFoundError extends TeamDomainError {
  public readonly code = 'INVITATION_NOT_FOUND';

  constructor() {
    super('Invitation not found');
  }
}

export class InvitationExpiredError extends TeamDomainError {
  public readonly code = 'INVITATION_EXPIRED';

  constructor() {
    super('Invitation has expired');
  }
}

export class InvitationAlreadyExistsError extends TeamDomainError {
  public readonly code = 'INVITATION_ALREADY_EXISTS';

  constructor(email: string) {
    super(`A pending invitation already exists for ${email}`);
  }
}

export class InvitationEmailMismatchError extends TeamDomainError {
  public readonly code = 'INVITATION_EMAIL_MISMATCH';

  constructor() {
    super('This invitation was sent to a different email address');
  }
}

export class InvitationNotPendingError extends TeamDomainError {
  public readonly code = 'INVITATION_NOT_PENDING';

  constructor() {
    super('Invitation is no longer pending');
  }
}

// ============================================
// Avatar Errors
// ============================================

export class InvalidAvatarUrlError extends TeamDomainError {
  public readonly code = 'INVALID_AVATAR_URL';

  constructor(reason: string) {
    super(`Invalid avatar URL: ${reason}`);
  }
}

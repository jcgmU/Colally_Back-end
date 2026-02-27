import { UserId } from '@domain/auth/value-objects/index.js';

import { MembershipId, TeamId, TeamRole } from '../value-objects/index.js';

/**
 * Props for creating a new TeamMembership
 */
export interface CreateMembershipProps {
  userId: UserId;
  teamId: TeamId;
  role: TeamRole;
}

/**
 * Props for reconstituting a TeamMembership from persistence
 */
export interface ReconstituteMembershipProps {
  id: MembershipId;
  userId: UserId;
  teamId: TeamId;
  role: TeamRole;
  joinedAt: Date;
}

/**
 * TeamMembership Entity
 * Represents a user's membership in a team with a specific role
 */
export class TeamMembership {
  private constructor(
    private readonly _id: MembershipId,
    private readonly _userId: UserId,
    private readonly _teamId: TeamId,
    private _role: TeamRole,
    private readonly _joinedAt: Date
  ) {}

  /**
   * Create a new TeamMembership
   */
  public static create(props: CreateMembershipProps): TeamMembership {
    return new TeamMembership(
      MembershipId.generate(),
      props.userId,
      props.teamId,
      props.role,
      new Date()
    );
  }

  /**
   * Create an owner membership (convenience method)
   */
  public static createOwner(userId: UserId, teamId: TeamId): TeamMembership {
    return TeamMembership.create({
      userId,
      teamId,
      role: TeamRole.OWNER,
    });
  }

  /**
   * Reconstitute a TeamMembership from persistence
   */
  public static reconstitute(props: ReconstituteMembershipProps): TeamMembership {
    return new TeamMembership(
      props.id,
      props.userId,
      props.teamId,
      props.role,
      props.joinedAt
    );
  }

  // Getters
  public get id(): MembershipId {
    return this._id;
  }

  public get userId(): UserId {
    return this._userId;
  }

  public get teamId(): TeamId {
    return this._teamId;
  }

  public get role(): TeamRole {
    return this._role;
  }

  public get joinedAt(): Date {
    return this._joinedAt;
  }

  // Role checks
  public isOwner(): boolean {
    return this._role.isOwner();
  }

  public isAdmin(): boolean {
    return this._role.isAdmin();
  }

  public isMember(): boolean {
    return this._role.isMember();
  }

  /**
   * Check if this member can manage other members (owner or admin)
   */
  public canManageMembers(): boolean {
    return this._role.isAtLeast(TeamRole.ADMIN);
  }

  /**
   * Check if this member can modify team settings (owner or admin)
   */
  public canModifyTeam(): boolean {
    return this._role.isAtLeast(TeamRole.ADMIN);
  }

  /**
   * Check if this member can delete the team (owner only)
   */
  public canDeleteTeam(): boolean {
    return this._role.isOwner();
  }

  /**
   * Check if this member can invite someone with the given role
   */
  public canInviteAs(inviteRole: TeamRole): boolean {
    // Owner can invite anyone (except as owner - ownership is transferred)
    if (this._role.isOwner()) {
      return !inviteRole.isOwner();
    }

    // Admin can only invite as member
    if (this._role.isAdmin()) {
      return inviteRole.isMember();
    }

    // Members cannot invite
    return false;
  }

  /**
   * Check if this member can remove the target member
   */
  public canRemove(targetRole: TeamRole): boolean {
    // Cannot remove owner
    if (targetRole.isOwner()) {
      return false;
    }

    // Owner can remove anyone except themselves
    if (this._role.isOwner()) {
      return true;
    }

    // Admin can only remove members
    if (this._role.isAdmin()) {
      return targetRole.isMember();
    }

    return false;
  }

  /**
   * Check if this member can change roles
   */
  public canChangeRoles(): boolean {
    return this._role.isOwner();
  }

  /**
   * Change the role of this membership
   */
  public changeRole(newRole: TeamRole): TeamMembership {
    return new TeamMembership(
      this._id,
      this._userId,
      this._teamId,
      newRole,
      this._joinedAt
    );
  }
}

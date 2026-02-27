import { Email, UserId } from '@domain/auth/value-objects/index.js';

import {
  InvitationExpiredError,
  InvitationNotPendingError,
  InvitationEmailMismatchError,
} from '../errors/index.js';
import {
  InvitationId,
  InvitationStatus,
  InvitationToken,
  TeamId,
  TeamRole,
} from '../value-objects/index.js';

/**
 * Props for creating a new TeamInvitation
 */
export interface CreateInvitationProps {
  teamId: TeamId;
  email: Email;
  role: TeamRole;
  invitedBy: UserId;
  expiresInDays?: number;
}

/**
 * Props for reconstituting a TeamInvitation from persistence
 */
export interface ReconstituteInvitationProps {
  id: InvitationId;
  teamId: TeamId;
  email: Email;
  role: TeamRole;
  token: InvitationToken;
  invitedBy: UserId;
  expiresAt: Date;
  status: InvitationStatus;
  createdAt: Date;
}

/**
 * TeamInvitation Entity
 * Represents an invitation to join a team
 */
export class TeamInvitation {
  public static readonly DEFAULT_EXPIRY_DAYS = 7;

  private constructor(
    private readonly _id: InvitationId,
    private readonly _teamId: TeamId,
    private readonly _email: Email,
    private readonly _role: TeamRole,
    private readonly _token: InvitationToken,
    private readonly _invitedBy: UserId,
    private readonly _expiresAt: Date,
    private _status: InvitationStatus,
    private readonly _createdAt: Date
  ) {}

  /**
   * Create a new TeamInvitation
   */
  public static create(props: CreateInvitationProps): TeamInvitation {
    const now = new Date();
    const expiryDays = props.expiresInDays ?? TeamInvitation.DEFAULT_EXPIRY_DAYS;
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    return new TeamInvitation(
      InvitationId.generate(),
      props.teamId,
      props.email,
      props.role,
      InvitationToken.generate(),
      props.invitedBy,
      expiresAt,
      InvitationStatus.PENDING,
      now
    );
  }

  /**
   * Reconstitute a TeamInvitation from persistence
   */
  public static reconstitute(props: ReconstituteInvitationProps): TeamInvitation {
    return new TeamInvitation(
      props.id,
      props.teamId,
      props.email,
      props.role,
      props.token,
      props.invitedBy,
      props.expiresAt,
      props.status,
      props.createdAt
    );
  }

  // Getters
  public get id(): InvitationId {
    return this._id;
  }

  public get teamId(): TeamId {
    return this._teamId;
  }

  public get email(): Email {
    return this._email;
  }

  public get role(): TeamRole {
    return this._role;
  }

  public get token(): InvitationToken {
    return this._token;
  }

  public get invitedBy(): UserId {
    return this._invitedBy;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }

  public get status(): InvitationStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  // Status checks
  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  public isPending(): boolean {
    return this._status.isPending();
  }

  public isAccepted(): boolean {
    return this._status.isAccepted();
  }

  public isRejected(): boolean {
    return this._status.isRejected();
  }

  /**
   * Check if this invitation can be accepted by the given email
   */
  public canBeAcceptedBy(email: Email): boolean {
    return this._email.equals(email) && this.isPending() && !this.isExpired();
  }

  /**
   * Validate and accept the invitation
   * @throws InvitationExpiredError if expired
   * @throws InvitationNotPendingError if not pending
   * @throws InvitationEmailMismatchError if email doesn't match
   */
  public accept(acceptingEmail: Email): TeamInvitation {
    if (this.isExpired()) {
      throw new InvitationExpiredError();
    }

    if (!this.isPending()) {
      throw new InvitationNotPendingError();
    }

    if (!this._email.equals(acceptingEmail)) {
      throw new InvitationEmailMismatchError();
    }

    return new TeamInvitation(
      this._id,
      this._teamId,
      this._email,
      this._role,
      this._token,
      this._invitedBy,
      this._expiresAt,
      InvitationStatus.ACCEPTED,
      this._createdAt
    );
  }

  /**
   * Reject the invitation
   */
  public reject(): TeamInvitation {
    if (!this.isPending()) {
      throw new InvitationNotPendingError();
    }

    return new TeamInvitation(
      this._id,
      this._teamId,
      this._email,
      this._role,
      this._token,
      this._invitedBy,
      this._expiresAt,
      InvitationStatus.REJECTED,
      this._createdAt
    );
  }

  /**
   * Mark the invitation as expired
   */
  public markExpired(): TeamInvitation {
    return new TeamInvitation(
      this._id,
      this._teamId,
      this._email,
      this._role,
      this._token,
      this._invitedBy,
      this._expiresAt,
      InvitationStatus.EXPIRED,
      this._createdAt
    );
  }
}

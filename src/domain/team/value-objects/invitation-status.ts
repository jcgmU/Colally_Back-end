import { InvalidInvitationStatusError } from '../errors/index.js';

/**
 * InvitationStatus Value Object
 * Represents the current state of an invitation
 */
export class InvitationStatus {
  public static readonly PENDING = new InvitationStatus('pending');
  public static readonly ACCEPTED = new InvitationStatus('accepted');
  public static readonly REJECTED = new InvitationStatus('rejected');
  public static readonly EXPIRED = new InvitationStatus('expired');

  private static readonly VALID_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): InvitationStatus {
    const normalized = value.toLowerCase().trim();

    if (!InvitationStatus.VALID_STATUSES.includes(normalized as typeof InvitationStatus.VALID_STATUSES[number])) {
      throw new InvalidInvitationStatusError(value);
    }

    switch (normalized) {
      case 'pending':
        return InvitationStatus.PENDING;
      case 'accepted':
        return InvitationStatus.ACCEPTED;
      case 'rejected':
        return InvitationStatus.REJECTED;
      case 'expired':
        return InvitationStatus.EXPIRED;
      default:
        throw new InvalidInvitationStatusError(value);
    }
  }

  public get value(): string {
    return this._value;
  }

  public isPending(): boolean {
    return this._value === 'pending';
  }

  public isAccepted(): boolean {
    return this._value === 'accepted';
  }

  public isRejected(): boolean {
    return this._value === 'rejected';
  }

  public isExpired(): boolean {
    return this._value === 'expired';
  }

  public equals(other: InvitationStatus): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

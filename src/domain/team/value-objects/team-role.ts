import { InvalidTeamRoleError } from '../errors/index.js';

/**
 * TeamRole Value Object
 * Represents a user's role within a team
 */
export class TeamRole {
  public static readonly OWNER = new TeamRole('owner');
  public static readonly ADMIN = new TeamRole('admin');
  public static readonly MEMBER = new TeamRole('member');

  private static readonly VALID_ROLES = ['owner', 'admin', 'member'] as const;
  private static readonly HIERARCHY: Record<string, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): TeamRole {
    const normalized = value.toLowerCase().trim();

    if (!TeamRole.VALID_ROLES.includes(normalized as typeof TeamRole.VALID_ROLES[number])) {
      throw new InvalidTeamRoleError(value);
    }

    // Return singleton instances
    switch (normalized) {
      case 'owner':
        return TeamRole.OWNER;
      case 'admin':
        return TeamRole.ADMIN;
      case 'member':
        return TeamRole.MEMBER;
      default:
        throw new InvalidTeamRoleError(value);
    }
  }

  public get value(): string {
    return this._value;
  }

  public isOwner(): boolean {
    return this._value === 'owner';
  }

  public isAdmin(): boolean {
    return this._value === 'admin';
  }

  public isMember(): boolean {
    return this._value === 'member';
  }

  /**
   * Check if this role has at least the same level as the given role
   */
  public isAtLeast(role: TeamRole): boolean {
    const thisLevel = TeamRole.HIERARCHY[this._value] ?? 0;
    const otherLevel = TeamRole.HIERARCHY[role._value] ?? 0;
    return thisLevel >= otherLevel;
  }

  /**
   * Check if this role is higher than the given role
   */
  public isHigherThan(role: TeamRole): boolean {
    const thisLevel = TeamRole.HIERARCHY[this._value] ?? 0;
    const otherLevel = TeamRole.HIERARCHY[role._value] ?? 0;
    return thisLevel > otherLevel;
  }

  public equals(other: TeamRole): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

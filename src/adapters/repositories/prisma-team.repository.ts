import type {
  Team as PrismaTeam,
  TeamMembership as PrismaMembership,
} from '@prisma/client';
import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Team, TeamMembership } from '@domain/team/entities/index.js';
import type {
  ITeamRepository,
  MembershipWithUser,
  TeamWithMembership,
  TeamWithRole,
} from '@domain/team/ports/team-repository.port.js';
import {
  MembershipId,
  TeamId,
  TeamName,
  TeamRole,
} from '@domain/team/value-objects/index.js';
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';

/**
 * Prisma Team Repository Implementation
 */
@injectable()
export class PrismaTeamRepository implements ITeamRepository {
  constructor(
    @inject(DATABASE_SERVICE_TOKEN)
    private readonly database: DatabaseService
  ) {}

  // ============================================
  // Team CRUD
  // ============================================

  public async create(team: Team, ownerId: UserId): Promise<Team> {
    const prismaTeam = await this.database.getClient().$transaction(async (tx) => {
      // Create the team
      const created = await tx.team.create({
        data: {
          id: team.id.value,
          name: team.name.value,
          description: team.description,
        },
      });

      // Create owner membership
      await tx.teamMembership.create({
        data: {
          teamId: created.id,
          userId: ownerId.value,
          role: TeamRole.OWNER.value,
        },
      });

      return created;
    });

    return this.teamToDomain(prismaTeam);
  }

  public async findById(id: TeamId): Promise<Team | null> {
    const prismaTeam = await this.database.getClient().team.findUnique({
      where: { id: id.value },
    });

    if (prismaTeam === null) {
      return null;
    }

    return this.teamToDomain(prismaTeam);
  }

  public async findByIdWithMembership(
    id: TeamId,
    userId: UserId
  ): Promise<TeamWithMembership | null> {
    const prismaTeam = await this.database.getClient().team.findUnique({
      where: { id: id.value },
      include: {
        memberships: {
          where: { userId: userId.value },
          take: 1,
        },
      },
    });

    if (prismaTeam === null) {
      return null;
    }

    const prismaMembership = prismaTeam.memberships[0];
    const membership =
      prismaMembership !== undefined
        ? this.membershipToDomain(prismaMembership)
        : null;

    return {
      team: this.teamToDomain(prismaTeam),
      membership,
    };
  }

  public async update(team: Team): Promise<Team> {
    const prismaTeam = await this.database.getClient().team.update({
      where: { id: team.id.value },
      data: {
        name: team.name.value,
        description: team.description,
        updatedAt: team.updatedAt,
      },
    });

    return this.teamToDomain(prismaTeam);
  }

  public async delete(id: TeamId): Promise<void> {
    await this.database.getClient().team.delete({
      where: { id: id.value },
    });
  }

  // ============================================
  // User's Teams
  // ============================================

  public async findByUserId(userId: UserId): Promise<TeamWithRole[]> {
    const memberships = await this.database.getClient().teamMembership.findMany({
      where: { userId: userId.value },
      include: { team: true },
    });

    return memberships.map((m) => ({
      team: this.teamToDomain(m.team),
      role: TeamRole.create(m.role),
    }));
  }

  // ============================================
  // Memberships
  // ============================================

  public async getMemberships(teamId: TeamId): Promise<MembershipWithUser[]> {
    const memberships = await this.database.getClient().teamMembership.findMany({
      where: { teamId: teamId.value },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      membership: this.membershipToDomain(m),
      userName: m.user.name,
      userEmail: m.user.email,
      userAvatarUrl: m.user.avatarUrl,
    }));
  }

  public async getMembership(
    teamId: TeamId,
    userId: UserId
  ): Promise<TeamMembership | null> {
    const membership = await this.database.getClient().teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: userId.value,
          teamId: teamId.value,
        },
      },
    });

    if (membership === null) {
      return null;
    }

    return this.membershipToDomain(membership);
  }

  public async addMembership(membership: TeamMembership): Promise<TeamMembership> {
    const created = await this.database.getClient().teamMembership.create({
      data: {
        id: membership.id.value,
        userId: membership.userId.value,
        teamId: membership.teamId.value,
        role: membership.role.value,
        joinedAt: membership.joinedAt,
      },
    });

    return this.membershipToDomain(created);
  }

  public async updateMembership(membership: TeamMembership): Promise<TeamMembership> {
    const updated = await this.database.getClient().teamMembership.update({
      where: { id: membership.id.value },
      data: {
        role: membership.role.value,
      },
    });

    return this.membershipToDomain(updated);
  }

  public async removeMembership(teamId: TeamId, userId: UserId): Promise<void> {
    await this.database.getClient().teamMembership.delete({
      where: {
        userId_teamId: {
          userId: userId.value,
          teamId: teamId.value,
        },
      },
    });
  }

  public async countMembers(teamId: TeamId): Promise<number> {
    return await this.database.getClient().teamMembership.count({
      where: { teamId: teamId.value },
    });
  }

  // ============================================
  // Checks
  // ============================================

  public async isMember(teamId: TeamId, userId: UserId): Promise<boolean> {
    const count = await this.database.getClient().teamMembership.count({
      where: {
        teamId: teamId.value,
        userId: userId.value,
      },
    });

    return count > 0;
  }

  public async isEmailMember(teamId: TeamId, email: string): Promise<boolean> {
    const count = await this.database.getClient().teamMembership.count({
      where: {
        teamId: teamId.value,
        user: { email },
      },
    });

    return count > 0;
  }

  // ============================================
  // Private Mappers
  // ============================================

  private teamToDomain(prismaTeam: PrismaTeam): Team {
    return Team.reconstitute({
      id: TeamId.create(prismaTeam.id),
      name: TeamName.create(prismaTeam.name),
      description: prismaTeam.description,
      createdAt: prismaTeam.createdAt,
      updatedAt: prismaTeam.updatedAt,
    });
  }

  private membershipToDomain(prismaMembership: PrismaMembership): TeamMembership {
    return TeamMembership.reconstitute({
      id: MembershipId.create(prismaMembership.id),
      userId: UserId.create(prismaMembership.userId),
      teamId: TeamId.create(prismaMembership.teamId),
      role: TeamRole.create(prismaMembership.role),
      joinedAt: prismaMembership.joinedAt,
    });
  }
}

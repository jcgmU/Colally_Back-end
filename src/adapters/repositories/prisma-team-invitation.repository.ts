import type { TeamInvitation as PrismaInvitation } from '@prisma/client';
import { inject, injectable } from 'tsyringe';

import { Email, UserId } from '@domain/auth/value-objects/index.js';
import { TeamInvitation } from '@domain/team/entities/index.js';
import type {
  ITeamInvitationRepository,
  InvitationWithTeamName,
} from '@domain/team/ports/team-invitation-repository.port.js';
import {
  InvitationId,
  InvitationStatus,
  InvitationToken,
  TeamId,
  TeamRole,
} from '@domain/team/value-objects/index.js';
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';

/**
 * Prisma Team Invitation Repository Implementation
 */
@injectable()
export class PrismaTeamInvitationRepository implements ITeamInvitationRepository {
  constructor(
    @inject(DATABASE_SERVICE_TOKEN)
    private readonly database: DatabaseService
  ) {}

  // ============================================
  // CRUD
  // ============================================

  public async create(invitation: TeamInvitation): Promise<TeamInvitation> {
    const created = await this.database.getClient().teamInvitation.create({
      data: {
        id: invitation.id.value,
        teamId: invitation.teamId.value,
        email: invitation.email.value,
        role: invitation.role.value,
        token: invitation.token.value,
        invitedBy: invitation.invitedBy.value,
        expiresAt: invitation.expiresAt,
        status: invitation.status.value,
        createdAt: invitation.createdAt,
      },
    });

    return this.toDomain(created);
  }

  public async findById(id: InvitationId): Promise<TeamInvitation | null> {
    const invitation = await this.database.getClient().teamInvitation.findUnique({
      where: { id: id.value },
    });

    if (invitation === null) {
      return null;
    }

    return this.toDomain(invitation);
  }

  public async findByToken(token: InvitationToken): Promise<TeamInvitation | null> {
    const invitation = await this.database.getClient().teamInvitation.findUnique({
      where: { token: token.value },
    });

    if (invitation === null) {
      return null;
    }

    return this.toDomain(invitation);
  }

  public async update(invitation: TeamInvitation): Promise<TeamInvitation> {
    const updated = await this.database.getClient().teamInvitation.update({
      where: { id: invitation.id.value },
      data: {
        status: invitation.status.value,
      },
    });

    return this.toDomain(updated);
  }

  public async delete(id: InvitationId): Promise<void> {
    await this.database.getClient().teamInvitation.delete({
      where: { id: id.value },
    });
  }

  // ============================================
  // Queries
  // ============================================

  public async findPendingByEmail(email: Email): Promise<InvitationWithTeamName[]> {
    const invitations = await this.database.getClient().teamInvitation.findMany({
      where: {
        email: email.value,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        team: { select: { name: true } },
        inviter: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      invitation: this.toDomain(inv),
      teamName: inv.team.name,
      inviterName: inv.inviter.name,
    }));
  }

  public async findPendingByTeamAndEmail(
    teamId: TeamId,
    email: Email
  ): Promise<TeamInvitation | null> {
    const invitation = await this.database.getClient().teamInvitation.findFirst({
      where: {
        teamId: teamId.value,
        email: email.value,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (invitation === null) {
      return null;
    }

    return this.toDomain(invitation);
  }

  public async findByTeam(teamId: TeamId): Promise<TeamInvitation[]> {
    const invitations = await this.database.getClient().teamInvitation.findMany({
      where: { teamId: teamId.value },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => this.toDomain(inv));
  }

  // ============================================
  // Private Mapper
  // ============================================

  private toDomain(prismaInvitation: PrismaInvitation): TeamInvitation {
    return TeamInvitation.reconstitute({
      id: InvitationId.create(prismaInvitation.id),
      teamId: TeamId.create(prismaInvitation.teamId),
      email: Email.create(prismaInvitation.email),
      role: TeamRole.create(prismaInvitation.role),
      token: InvitationToken.create(prismaInvitation.token),
      invitedBy: UserId.create(prismaInvitation.invitedBy),
      expiresAt: prismaInvitation.expiresAt,
      status: InvitationStatus.create(prismaInvitation.status),
      createdAt: prismaInvitation.createdAt,
    });
  }
}

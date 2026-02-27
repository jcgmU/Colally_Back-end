import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { TeamInvitation } from '@domain/team/entities/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import {
  type ITeamInvitationRepository,
  TEAM_INVITATION_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-invitation-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';

import { type GetTeamInvitationsOutput, type InvitationOutput } from '../dtos/index.js';

/**
 * Get Team Invitations Use Case
 * Retrieves all invitations for a team (only accessible to admins/owners)
 */
@injectable()
export class GetTeamInvitationsUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository,
    @inject(TEAM_INVITATION_REPOSITORY_TOKEN)
    private readonly invitationRepository: ITeamInvitationRepository
  ) {}

  public async execute(actorUserId: string, teamId: string): Promise<GetTeamInvitationsOutput> {
    const actorUserIdVO = UserId.create(actorUserId);
    const teamIdVO = TeamId.create(teamId);

    // Verify team exists and actor is a member
    const teamResult = await this.teamRepository.findByIdWithMembership(teamIdVO, actorUserIdVO);

    if (teamResult === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (teamResult.membership === null) {
      throw new NotMemberError();
    }

    // Only admins and owners can view invitations
    if (!teamResult.membership.canManageMembers()) {
      throw new InsufficientPermissionError('view team invitations');
    }

    // Get all invitations for the team
    const invitations = await this.invitationRepository.findByTeam(teamIdVO);

    return {
      invitations: invitations.map((inv) => this.toInvitationOutput(inv)),
    };
  }

  private toInvitationOutput(invitation: TeamInvitation): InvitationOutput {
    return {
      id: invitation.id.value,
      teamId: invitation.teamId.value,
      email: invitation.email.value,
      role: invitation.role.value,
      status: invitation.status.value,
      invitedBy: invitation.invitedBy.value,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}

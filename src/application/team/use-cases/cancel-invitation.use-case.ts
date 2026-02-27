import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  InvitationNotFoundError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import {
  type ITeamInvitationRepository,
  TEAM_INVITATION_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-invitation-repository.port.js';
import { InvitationId } from '@domain/team/value-objects/index.js';

import { type CancelInvitationOutput } from '../dtos/index.js';

/**
 * Cancel Invitation Use Case
 * Allows admins/owners to cancel a pending invitation
 *
 * Rules:
 * - Only owner or admin can cancel invitations
 * - Invitation must exist and belong to the team
 * - Invitation must be pending (cannot cancel accepted/rejected)
 */
@injectable()
export class CancelInvitationUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository,
    @inject(TEAM_INVITATION_REPOSITORY_TOKEN)
    private readonly invitationRepository: ITeamInvitationRepository
  ) {}

  public async execute(
    actorUserId: string,
    teamId: string,
    invitationId: string
  ): Promise<CancelInvitationOutput> {
    const actorUserIdVO = UserId.create(actorUserId);
    const invitationIdVO = InvitationId.create(invitationId);

    // Get the invitation first
    const invitation = await this.invitationRepository.findById(invitationIdVO);

    if (invitation === null) {
      throw new InvitationNotFoundError();
    }

    // Verify invitation belongs to the specified team
    if (invitation.teamId.value !== teamId) {
      throw new InvitationNotFoundError();
    }

    // Verify team exists and actor is a member
    const teamResult = await this.teamRepository.findByIdWithMembership(
      invitation.teamId,
      actorUserIdVO
    );

    if (teamResult === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (teamResult.membership === null) {
      throw new NotMemberError();
    }

    // Only admins and owners can cancel invitations
    if (!teamResult.membership.canManageMembers()) {
      throw new InsufficientPermissionError('cancel invitations');
    }

    // Can only cancel pending invitations
    if (!invitation.isPending()) {
      throw new InvitationNotFoundError(); // Treat non-pending as not found
    }

    // Delete the invitation
    await this.invitationRepository.delete(invitationIdVO);

    return {
      success: true,
    };
  }
}

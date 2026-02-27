import { inject, injectable } from 'tsyringe';

import { Email, UserId } from '@domain/auth/value-objects/index.js';
import { type IUserRepository, USER_REPOSITORY_TOKEN } from '@domain/auth/ports/user-repository.port.js';
import {
  type ITeamInvitationRepository,
  type InvitationWithTeamName,
  TEAM_INVITATION_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-invitation-repository.port.js';

import { type GetMyInvitationsOutput, type InvitationWithTeamOutput } from '../dtos/index.js';

/**
 * Get My Invitations Use Case
 * Retrieves all pending invitations for the current user (by email)
 */
@injectable()
export class GetMyInvitationsUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @inject(TEAM_INVITATION_REPOSITORY_TOKEN)
    private readonly invitationRepository: ITeamInvitationRepository
  ) {}

  public async execute(userId: string): Promise<GetMyInvitationsOutput> {
    const userIdVO = UserId.create(userId);

    // Get user's email
    const user = await this.userRepository.findById(userIdVO);

    if (user === null) {
      // User not found - return empty list
      return { invitations: [] };
    }

    const userEmail = Email.create(user.email.value);

    // Get all pending invitations for this email
    const invitations = await this.invitationRepository.findPendingByEmail(userEmail);

    return {
      invitations: invitations.map((inv) => this.toInvitationWithTeamOutput(inv)),
    };
  }

  private toInvitationWithTeamOutput(data: InvitationWithTeamName): InvitationWithTeamOutput {
    return {
      invitation: {
        id: data.invitation.id.value,
        teamId: data.invitation.teamId.value,
        email: data.invitation.email.value,
        role: data.invitation.role.value,
        status: data.invitation.status.value,
        invitedBy: data.invitation.invitedBy.value,
        inviterName: data.inviterName,
        expiresAt: data.invitation.expiresAt,
        createdAt: data.invitation.createdAt,
      },
      teamName: data.teamName,
      inviterName: data.inviterName,
    };
  }
}

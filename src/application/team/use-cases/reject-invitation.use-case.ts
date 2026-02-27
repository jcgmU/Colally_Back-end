import { inject, injectable } from 'tsyringe';

import { type IUserRepository, USER_REPOSITORY_TOKEN } from '@domain/auth/ports/user-repository.port.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import {
  InvitationNotFoundError,
  InvitationEmailMismatchError,
} from '@domain/team/errors/index.js';
import {
  type ITeamInvitationRepository,
  TEAM_INVITATION_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-invitation-repository.port.js';
import { InvitationId } from '@domain/team/value-objects/index.js';

import { type RejectInvitationOutput } from '../dtos/index.js';

/**
 * Reject Invitation Use Case
 * Allows a user to reject a team invitation
 *
 * Rules:
 * - Invitation must exist and be pending
 * - User's email must match invitation email
 */
@injectable()
export class RejectInvitationUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @inject(TEAM_INVITATION_REPOSITORY_TOKEN)
    private readonly invitationRepository: ITeamInvitationRepository
  ) {}

  public async execute(userId: string, invitationId: string): Promise<RejectInvitationOutput> {
    const userIdVO = UserId.create(userId);
    const invitationIdVO = InvitationId.create(invitationId);

    // Get the invitation
    const invitation = await this.invitationRepository.findById(invitationIdVO);

    if (invitation === null) {
      throw new InvitationNotFoundError();
    }

    // Get the user
    const user = await this.userRepository.findById(userIdVO);

    if (user === null) {
      throw new InvitationNotFoundError(); // Generic error to not leak info
    }

    // Verify email matches
    if (!invitation.email.equals(user.email)) {
      throw new InvitationEmailMismatchError();
    }

    // Reject the invitation (this validates status is pending)
    const rejectedInvitation = invitation.reject();

    // Update invitation status
    await this.invitationRepository.update(rejectedInvitation);

    return {
      success: true,
    };
  }
}

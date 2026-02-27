import { inject, injectable } from 'tsyringe';

import { type IUserRepository, USER_REPOSITORY_TOKEN } from '@domain/auth/ports/user-repository.port.js';
import { UserId } from '@domain/auth/value-objects/index.js';
import { TeamMembership } from '@domain/team/entities/index.js';
import {
  InvitationNotFoundError,
  AlreadyMemberError,
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

import { type AcceptInvitationOutput } from '../dtos/index.js';

/**
 * Accept Invitation Use Case
 * Allows a user to accept a team invitation
 *
 * Rules:
 * - Invitation must exist and be pending
 * - User's email must match invitation email
 * - Invitation must not be expired
 * - User must not already be a member of the team
 */
@injectable()
export class AcceptInvitationUseCase {
  constructor(
    @inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository,
    @inject(TEAM_INVITATION_REPOSITORY_TOKEN)
    private readonly invitationRepository: ITeamInvitationRepository
  ) {}

  public async execute(userId: string, invitationId: string): Promise<AcceptInvitationOutput> {
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

    // Accept the invitation (this validates email match, expiry, and status)
    const acceptedInvitation = invitation.accept(user.email);

    // Check if user is already a member (edge case: joined through another invitation)
    const existingMembership = await this.teamRepository.getMembership(
      invitation.teamId,
      user.id
    );

    if (existingMembership !== null) {
      throw new AlreadyMemberError();
    }

    // Create membership
    const membership = TeamMembership.create({
      userId: user.id,
      teamId: invitation.teamId,
      role: invitation.role,
    });

    await this.teamRepository.addMembership(membership);

    // Update invitation status
    await this.invitationRepository.update(acceptedInvitation);

    // Get team name for response
    const team = await this.teamRepository.findById(invitation.teamId);

    return {
      teamId: invitation.teamId.value,
      teamName: team?.name.value ?? 'Unknown Team',
      role: invitation.role.value,
    };
  }
}

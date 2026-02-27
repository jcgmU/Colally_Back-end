import { inject, injectable } from 'tsyringe';

import { Email, UserId } from '@domain/auth/value-objects/index.js';
import { TeamInvitation } from '@domain/team/entities/index.js';
import {
  TeamNotFoundError,
  NotMemberError,
  InsufficientPermissionError,
  AlreadyMemberError,
  InvitationAlreadyExistsError,
} from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import {
  type ITeamInvitationRepository,
  TEAM_INVITATION_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-invitation-repository.port.js';
import { TeamId, TeamRole } from '@domain/team/value-objects/index.js';

import {
  type CreateInvitationInput,
  type CreateInvitationOutput,
  type InvitationOutput,
  CreateInvitationInputSchema,
} from '../dtos/index.js';

/**
 * Create Invitation Use Case
 * Allows admins/owners to invite users to join a team
 *
 * Rules:
 * - Only owner or admin can create invitations
 * - Cannot invite someone who is already a member
 * - Cannot create duplicate pending invitations for the same email
 * - Admin can only invite as member
 * - Owner can invite as admin or member (not as owner)
 */
@injectable()
export class CreateInvitationUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository,
    @inject(TEAM_INVITATION_REPOSITORY_TOKEN)
    private readonly invitationRepository: ITeamInvitationRepository
  ) {}

  public async execute(
    actorUserId: string,
    teamId: string,
    input: CreateInvitationInput
  ): Promise<CreateInvitationOutput> {
    // Validate input
    const validatedInput = CreateInvitationInputSchema.parse(input);

    const actorUserIdVO = UserId.create(actorUserId);
    const teamIdVO = TeamId.create(teamId);
    const inviteeEmail = Email.create(validatedInput.email);
    const inviteRole = TeamRole.create(validatedInput.role);

    // Verify team exists and actor is a member
    const teamResult = await this.teamRepository.findByIdWithMembership(teamIdVO, actorUserIdVO);

    if (teamResult === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (teamResult.membership === null) {
      throw new NotMemberError();
    }

    const actorMembership = teamResult.membership;

    // Check actor has permission to invite
    if (!actorMembership.canManageMembers()) {
      throw new InsufficientPermissionError('invite team members');
    }

    // Check actor can invite with the specified role
    if (!actorMembership.canInviteAs(inviteRole)) {
      throw new InsufficientPermissionError(`invite as ${inviteRole.value}`);
    }

    // Check if email is already a member
    const isAlreadyMember = await this.teamRepository.isEmailMember(teamIdVO, validatedInput.email);
    if (isAlreadyMember) {
      throw new AlreadyMemberError(validatedInput.email);
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findPendingByTeamAndEmail(
      teamIdVO,
      inviteeEmail
    );
    if (existingInvitation !== null) {
      throw new InvitationAlreadyExistsError(validatedInput.email);
    }

    // Create the invitation
    const invitation = TeamInvitation.create({
      teamId: teamIdVO,
      email: inviteeEmail,
      role: inviteRole,
      invitedBy: actorUserIdVO,
    });

    const savedInvitation = await this.invitationRepository.create(invitation);

    return {
      invitation: this.toInvitationOutput(savedInvitation),
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

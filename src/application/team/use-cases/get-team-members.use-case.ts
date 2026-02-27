import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { TeamNotFoundError, NotMemberError } from '@domain/team/errors/index.js';
import {
  type ITeamRepository,
  type MembershipWithUser,
  TEAM_REPOSITORY_TOKEN,
} from '@domain/team/ports/team-repository.port.js';
import { TeamId } from '@domain/team/value-objects/index.js';

import { type MemberOutput, type GetTeamMembersOutput } from '../dtos/index.js';

/**
 * Get Team Members Use Case
 * Retrieves all members of a team (only accessible to team members)
 */
@injectable()
export class GetTeamMembersUseCase {
  constructor(
    @inject(TEAM_REPOSITORY_TOKEN)
    private readonly teamRepository: ITeamRepository
  ) {}

  public async execute(userId: string, teamId: string): Promise<GetTeamMembersOutput> {
    const userIdVO = UserId.create(userId);
    const teamIdVO = TeamId.create(teamId);

    // Verify team exists and user is a member
    const result = await this.teamRepository.findByIdWithMembership(teamIdVO, userIdVO);

    if (result === null) {
      throw new TeamNotFoundError(teamId);
    }

    if (result.membership === null) {
      throw new NotMemberError();
    }

    // Get all members
    const memberships = await this.teamRepository.getMemberships(teamIdVO);

    return {
      members: memberships.map((m) => this.toMemberOutput(m)),
    };
  }

  private toMemberOutput(data: MembershipWithUser): MemberOutput {
    return {
      id: data.membership.id.value,
      userId: data.membership.userId.value,
      userName: data.userName,
      userEmail: data.userEmail,
      userAvatarUrl: data.userAvatarUrl,
      role: data.membership.role.value,
      joinedAt: data.membership.joinedAt,
    };
  }
}

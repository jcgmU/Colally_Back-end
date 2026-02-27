import { Email } from '@domain/auth/value-objects/index.js';

import { TeamInvitation } from '../entities/index.js';
import { InvitationId, InvitationToken, TeamId } from '../value-objects/index.js';

/**
 * Invitation with team name for display
 */
export interface InvitationWithTeamName {
  invitation: TeamInvitation;
  teamName: string;
  inviterName: string;
}

/**
 * ITeamInvitationRepository Port
 * Interface for team invitation persistence operations
 */
export interface ITeamInvitationRepository {
  // CRUD
  create(invitation: TeamInvitation): Promise<TeamInvitation>;
  findById(id: InvitationId): Promise<TeamInvitation | null>;
  findByToken(token: InvitationToken): Promise<TeamInvitation | null>;
  update(invitation: TeamInvitation): Promise<TeamInvitation>;
  delete(id: InvitationId): Promise<void>;

  // Queries
  findPendingByEmail(email: Email): Promise<InvitationWithTeamName[]>;
  findPendingByTeamAndEmail(teamId: TeamId, email: Email): Promise<TeamInvitation | null>;
  findByTeam(teamId: TeamId): Promise<TeamInvitation[]>;
}

/**
 * DI Token for ITeamInvitationRepository
 */
export const TEAM_INVITATION_REPOSITORY_TOKEN = Symbol('ITeamInvitationRepository');

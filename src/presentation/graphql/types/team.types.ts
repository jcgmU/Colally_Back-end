/**
 * GraphQL Type Definitions for Team Module
 */
export const teamTypeDefs = `#graphql
  # ============================================
  # Enums
  # ============================================

  enum TeamRole {
    owner
    admin
    member
  }

  enum InvitationStatus {
    pending
    accepted
    rejected
    expired
  }

  # ============================================
  # Types
  # ============================================

  type Team {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TeamWithRole {
    team: Team!
    role: TeamRole!
  }

  type TeamDetail {
    team: Team!
    role: TeamRole!
    memberCount: Int!
  }

  type Member {
    id: ID!
    userId: ID!
    userName: String!
    userEmail: String!
    userAvatarUrl: String
    role: TeamRole!
    joinedAt: DateTime!
  }

  type Invitation {
    id: ID!
    teamId: ID!
    email: String!
    role: TeamRole!
    status: InvitationStatus!
    invitedBy: ID!
    inviterName: String
    expiresAt: DateTime!
    createdAt: DateTime!
  }

  type InvitationWithTeam {
    invitation: Invitation!
    teamName: String!
    inviterName: String!
  }

  # ============================================
  # Payloads
  # ============================================

  type CreateTeamPayload {
    team: Team!
  }

  type UpdateTeamPayload {
    team: Team!
  }

  type DeleteTeamPayload {
    success: Boolean!
  }

  type TeamMembersPayload {
    members: [Member!]!
  }

  type ChangeMemberRolePayload {
    member: Member!
  }

  type RemoveMemberPayload {
    success: Boolean!
  }

  type LeaveTeamPayload {
    success: Boolean!
  }

  type CreateInvitationPayload {
    invitation: Invitation!
  }

  type TeamInvitationsPayload {
    invitations: [Invitation!]!
  }

  type MyInvitationsPayload {
    invitations: [InvitationWithTeam!]!
  }

  type AcceptInvitationPayload {
    teamId: ID!
    teamName: String!
    role: TeamRole!
  }

  type RejectInvitationPayload {
    success: Boolean!
  }

  type CancelInvitationPayload {
    success: Boolean!
  }

  # ============================================
  # Inputs
  # ============================================

  input CreateTeamInput {
    name: String!
    description: String
  }

  input UpdateTeamInput {
    name: String
    description: String
  }

  input ChangeMemberRoleInput {
    role: TeamRole!
  }

  input CreateInvitationInput {
    email: String!
    role: TeamRole!
  }

  # ============================================
  # Queries
  # ============================================

  extend type Query {
    """
    Get a team by ID (requires membership)
    """
    team(id: ID!): TeamDetail

    """
    Get all teams the current user is a member of
    """
    myTeams: [TeamWithRole!]!

    """
    Get all members of a team (requires membership)
    """
    teamMembers(teamId: ID!): TeamMembersPayload!

    """
    Get all invitations for a team (requires admin/owner)
    """
    teamInvitations(teamId: ID!): TeamInvitationsPayload!

    """
    Get all pending invitations for the current user
    """
    myInvitations: MyInvitationsPayload!
  }

  # ============================================
  # Mutations
  # ============================================

  extend type Mutation {
    # Team CRUD
    """
    Create a new team (current user becomes owner)
    """
    createTeam(input: CreateTeamInput!): CreateTeamPayload!

    """
    Update a team (requires admin/owner)
    """
    updateTeam(teamId: ID!, input: UpdateTeamInput!): UpdateTeamPayload!

    """
    Delete a team (requires owner)
    """
    deleteTeam(teamId: ID!): DeleteTeamPayload!

    # Membership management
    """
    Change a member's role (requires admin/owner)
    """
    changeMemberRole(teamId: ID!, userId: ID!, input: ChangeMemberRoleInput!): ChangeMemberRolePayload!

    """
    Remove a member from a team (requires admin/owner)
    """
    removeMember(teamId: ID!, userId: ID!): RemoveMemberPayload!

    """
    Leave a team (current user leaves)
    """
    leaveTeam(teamId: ID!): LeaveTeamPayload!

    # Invitation management
    """
    Create an invitation to join a team (requires admin/owner)
    """
    createInvitation(teamId: ID!, input: CreateInvitationInput!): CreateInvitationPayload!

    """
    Accept a team invitation
    """
    acceptInvitation(invitationId: ID!): AcceptInvitationPayload!

    """
    Reject a team invitation
    """
    rejectInvitation(invitationId: ID!): RejectInvitationPayload!

    """
    Cancel a team invitation (requires admin/owner)
    """
    cancelInvitation(teamId: ID!, invitationId: ID!): CancelInvitationPayload!
  }
`;

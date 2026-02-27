import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import {
  createTestServer,
  cleanupTestData,
  type TestServer,
  // Auth operations
  REGISTER_MUTATION,
  type RegisterResponse,
  // Team operations
  CREATE_TEAM_MUTATION,
  UPDATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION,
  TEAM_QUERY,
  MY_TEAMS_QUERY,
  TEAM_MEMBERS_QUERY,
  TEAM_INVITATIONS_QUERY,
  MY_INVITATIONS_QUERY,
  CHANGE_MEMBER_ROLE_MUTATION,
  REMOVE_MEMBER_MUTATION,
  LEAVE_TEAM_MUTATION,
  CREATE_INVITATION_MUTATION,
  ACCEPT_INVITATION_MUTATION,
  REJECT_INVITATION_MUTATION,
  CANCEL_INVITATION_MUTATION,
  // Team types
  type CreateTeamResponse,
  type UpdateTeamResponse,
  type DeleteTeamResponse,
  type GetTeamResponse,
  type GetMyTeamsResponse,
  type GetTeamMembersResponse,
  type GetTeamInvitationsResponse,
  type GetMyInvitationsResponse,
  type ChangeMemberRoleResponse,
  type RemoveMemberResponse,
  type LeaveTeamResponse,
  type CreateInvitationResponse,
  type AcceptInvitationResponse,
  type RejectInvitationResponse,
  type CancelInvitationResponse,
} from '@shared/test/e2e/index.js';

describe('Team E2E Tests', () => {
  let testServer: TestServer;

  // Test users
  const ownerUser = {
    email: 'owner@example.com',
    password: 'SecurePass123!',
    name: 'Team Owner',
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'SecurePass123!',
    name: 'Team Admin',
  };

  const memberUser = {
    email: 'member@example.com',
    password: 'SecurePass123!',
    name: 'Team Member',
  };

  const inviteeUser = {
    email: 'invitee@example.com',
    password: 'SecurePass123!',
    name: 'Invitee User',
  };

  // Test team
  const testTeam = {
    name: 'Test Team',
    description: 'A team for E2E testing',
  };

  // Helper to register and get token
  async function registerAndGetToken(userData: typeof ownerUser): Promise<{
    userId: string;
    accessToken: string;
  }> {
    const response = await testServer.executeOperation<RegisterResponse>(
      REGISTER_MUTATION,
      { input: userData }
    );
    return {
      userId: response.body.singleResult.data!.register.user.id,
      accessToken: response.body.singleResult.data!.register.tokens.accessToken,
    };
  }

  // Helper to create a team
  async function createTeam(
    accessToken: string,
    input: typeof testTeam = testTeam
  ): Promise<string> {
    const response = await testServer.executeOperation<CreateTeamResponse>(
      CREATE_TEAM_MUTATION,
      { input },
      { authorization: `Bearer ${accessToken}` }
    );
    return response.body.singleResult.data!.createTeam.team.id;
  }

  // Helper to invite and accept (creates a member)
  async function inviteAndAccept(
    ownerToken: string,
    teamId: string,
    inviteeEmail: string,
    inviteeToken: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<void> {
    // Create invitation
    const inviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
      CREATE_INVITATION_MUTATION,
      { teamId, input: { email: inviteeEmail, role } },
      { authorization: `Bearer ${ownerToken}` }
    );
    const invitationId = inviteResponse.body.singleResult.data!.createInvitation.invitation.id;

    // Accept invitation
    await testServer.executeOperation<AcceptInvitationResponse>(
      ACCEPT_INVITATION_MUTATION,
      { invitationId },
      { authorization: `Bearer ${inviteeToken}` }
    );
  }

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await cleanupTestData();
    await testServer.cleanup();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  // ============================================
  // Team CRUD Tests
  // ============================================
  describe('Team CRUD', () => {
    describe('CreateTeam Mutation', () => {
      it('should create a team successfully', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);

        const response = await testServer.executeOperation<CreateTeamResponse>(
          CREATE_TEAM_MUTATION,
          { input: testTeam },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.createTeam.team).toBeDefined();
        expect(response.body.singleResult.data?.createTeam.team.name).toBe(testTeam.name);
        expect(response.body.singleResult.data?.createTeam.team.description).toBe(testTeam.description);
      });

      it('should require authentication', async () => {
        const response = await testServer.executeOperation<CreateTeamResponse>(
          CREATE_TEAM_MUTATION,
          { input: testTeam }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
      });

      it('should return error for empty team name', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);

        const response = await testServer.executeOperation<CreateTeamResponse>(
          CREATE_TEAM_MUTATION,
          { input: { name: '', description: 'desc' } },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
      });

      it('should allow team without description', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);

        const response = await testServer.executeOperation<CreateTeamResponse>(
          CREATE_TEAM_MUTATION,
          { input: { name: 'Team Without Desc' } },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.createTeam.team.description).toBeNull();
      });
    });

    describe('Team Query', () => {
      it('should get team details as owner', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        const response = await testServer.executeOperation<GetTeamResponse>(
          TEAM_QUERY,
          { id: teamId },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.team).toBeDefined();
        expect(response.body.singleResult.data?.team?.team.name).toBe(testTeam.name);
        expect(response.body.singleResult.data?.team?.role).toBe('owner');
        expect(response.body.singleResult.data?.team?.memberCount).toBe(1);
      });

      it('should return null for non-existent team', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);

        const response = await testServer.executeOperation<GetTeamResponse>(
          TEAM_QUERY,
          { id: '00000000-0000-0000-0000-000000000000' },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('TEAM_NOT_FOUND');
      });

      it('should return error for non-member', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: otherToken } = await registerAndGetToken(memberUser);

        const response = await testServer.executeOperation<GetTeamResponse>(
          TEAM_QUERY,
          { id: teamId },
          { authorization: `Bearer ${otherToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('NOT_MEMBER');
      });
    });

    describe('MyTeams Query', () => {
      it('should return empty array when user has no teams', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);

        const response = await testServer.executeOperation<GetMyTeamsResponse>(
          MY_TEAMS_QUERY,
          undefined,
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.myTeams).toEqual([]);
      });

      it('should return all teams user is member of', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);

        // Create two teams
        await createTeam(accessToken, { name: 'Team 1', description: 'First' });
        await createTeam(accessToken, { name: 'Team 2', description: 'Second' });

        const response = await testServer.executeOperation<GetMyTeamsResponse>(
          MY_TEAMS_QUERY,
          undefined,
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.myTeams).toHaveLength(2);
        expect(response.body.singleResult.data?.myTeams[0].role).toBe('owner');
        expect(response.body.singleResult.data?.myTeams[1].role).toBe('owner');
      });
    });

    describe('UpdateTeam Mutation', () => {
      it('should update team as owner', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        const response = await testServer.executeOperation<UpdateTeamResponse>(
          UPDATE_TEAM_MUTATION,
          { teamId, input: { name: 'Updated Name', description: 'Updated desc' } },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.updateTeam.team.name).toBe('Updated Name');
        expect(response.body.singleResult.data?.updateTeam.team.description).toBe('Updated desc');
      });

      it('should update team as admin', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        const response = await testServer.executeOperation<UpdateTeamResponse>(
          UPDATE_TEAM_MUTATION,
          { teamId, input: { name: 'Admin Updated' } },
          { authorization: `Bearer ${adminToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.updateTeam.team.name).toBe('Admin Updated');
      });

      it('should not allow member to update team', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<UpdateTeamResponse>(
          UPDATE_TEAM_MUTATION,
          { teamId, input: { name: 'Member Updated' } },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });
    });

    describe('DeleteTeam Mutation', () => {
      it('should delete team as owner', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        const response = await testServer.executeOperation<DeleteTeamResponse>(
          DELETE_TEAM_MUTATION,
          { teamId },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.deleteTeam.success).toBe(true);

        // Verify team is deleted
        const getResponse = await testServer.executeOperation<GetTeamResponse>(
          TEAM_QUERY,
          { id: teamId },
          { authorization: `Bearer ${accessToken}` }
        );
        expect(getResponse.body.singleResult.errors).toBeDefined();
      });

      it('should not allow admin to delete team', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        const response = await testServer.executeOperation<DeleteTeamResponse>(
          DELETE_TEAM_MUTATION,
          { teamId },
          { authorization: `Bearer ${adminToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });
    });
  });

  // ============================================
  // Membership Tests
  // ============================================
  describe('Membership Management', () => {
    describe('TeamMembers Query', () => {
      it('should return all team members', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<GetTeamMembersResponse>(
          TEAM_MEMBERS_QUERY,
          { teamId },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.teamMembers.members).toHaveLength(2);
        
        const roles = response.body.singleResult.data?.teamMembers.members.map(m => m.role);
        expect(roles).toContain('owner');
        expect(roles).toContain('member');
      });

      it('should not allow non-member to see members', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: otherToken } = await registerAndGetToken(memberUser);

        const response = await testServer.executeOperation<GetTeamMembersResponse>(
          TEAM_MEMBERS_QUERY,
          { teamId },
          { authorization: `Bearer ${otherToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('NOT_MEMBER');
      });
    });

    describe('ChangeMemberRole Mutation', () => {
      it('should allow owner to promote member to admin', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { userId: memberId, accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<ChangeMemberRoleResponse>(
          CHANGE_MEMBER_ROLE_MUTATION,
          { teamId, userId: memberId, input: { role: 'admin' } },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.changeMemberRole.member.role).toBe('admin');
      });

      it('should not allow changing role to owner (validation rejects owner as invalid role)', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { userId: memberId, accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        const response = await testServer.executeOperation<ChangeMemberRoleResponse>(
          CHANGE_MEMBER_ROLE_MUTATION,
          { teamId, userId: memberId, input: { role: 'owner' } },
          { authorization: `Bearer ${adminToken}` }
        );

        // Note: 'owner' is rejected at Zod validation level (ChangeMemberRoleInputSchema only allows 'admin' | 'member')
        // This is intentional - owner role can never be assigned via changeMemberRole
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('VALIDATION_ERROR');
      });

      it('should not allow changing owner role', async () => {
        const { userId: ownerId, accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        const response = await testServer.executeOperation<ChangeMemberRoleResponse>(
          CHANGE_MEMBER_ROLE_MUTATION,
          { teamId, userId: ownerId, input: { role: 'member' } },
          { authorization: `Bearer ${adminToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('CANNOT_DEMOTE_OWNER');
      });
    });

    describe('RemoveMember Mutation', () => {
      it('should allow owner to remove member', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { userId: memberId, accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<RemoveMemberResponse>(
          REMOVE_MEMBER_MUTATION,
          { teamId, userId: memberId },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.removeMember.success).toBe(true);

        // Verify member is removed
        const membersResponse = await testServer.executeOperation<GetTeamMembersResponse>(
          TEAM_MEMBERS_QUERY,
          { teamId },
          { authorization: `Bearer ${ownerToken}` }
        );
        expect(membersResponse.body.singleResult.data?.teamMembers.members).toHaveLength(1);
      });

      it('should not allow member to remove other members', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: member1Token } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, member1Token, 'member');

        const { userId: member2Id, accessToken: member2Token } = await registerAndGetToken(inviteeUser);
        await inviteAndAccept(ownerToken, teamId, inviteeUser.email, member2Token, 'member');

        const response = await testServer.executeOperation<RemoveMemberResponse>(
          REMOVE_MEMBER_MUTATION,
          { teamId, userId: member2Id },
          { authorization: `Bearer ${member1Token}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });

      it('should not allow removing the owner', async () => {
        const { userId: ownerId, accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        const response = await testServer.executeOperation<RemoveMemberResponse>(
          REMOVE_MEMBER_MUTATION,
          { teamId, userId: ownerId },
          { authorization: `Bearer ${adminToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('CANNOT_REMOVE_OWNER');
      });
    });

    describe('LeaveTeam Mutation', () => {
      it('should allow member to leave team', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<LeaveTeamResponse>(
          LEAVE_TEAM_MUTATION,
          { teamId },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.leaveTeam.success).toBe(true);

        // Verify member left
        const myTeamsResponse = await testServer.executeOperation<GetMyTeamsResponse>(
          MY_TEAMS_QUERY,
          undefined,
          { authorization: `Bearer ${memberToken}` }
        );
        expect(myTeamsResponse.body.singleResult.data?.myTeams).toHaveLength(0);
      });

      it('should not allow owner to leave team', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const response = await testServer.executeOperation<LeaveTeamResponse>(
          LEAVE_TEAM_MUTATION,
          { teamId },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('OWNER_CANNOT_LEAVE');
      });
    });
  });

  // ============================================
  // Invitation Tests
  // ============================================
  describe('Invitation Management', () => {
    describe('CreateInvitation Mutation', () => {
      it('should create invitation as owner', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        // Register invitee first
        await registerAndGetToken(inviteeUser);

        const response = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.createInvitation.invitation).toBeDefined();
        expect(response.body.singleResult.data?.createInvitation.invitation.email).toBe(inviteeUser.email);
        expect(response.body.singleResult.data?.createInvitation.invitation.role).toBe('member');
        expect(response.body.singleResult.data?.createInvitation.invitation.status).toBe('pending');
      });

      it('should allow admin to invite as member only', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        await registerAndGetToken(inviteeUser);

        // Admin invites as member - should work
        const memberResponse = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${adminToken}` }
        );
        expect(memberResponse.body.singleResult.errors).toBeUndefined();
      });

      it('should not allow admin to invite as admin', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        await registerAndGetToken(inviteeUser);

        const response = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'admin' } },
          { authorization: `Bearer ${adminToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });

      it('should not allow member to create invitation', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        await registerAndGetToken(inviteeUser);

        const response = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });

      it('should return error if user is already a member', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: memberUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('ALREADY_MEMBER');
      });
    });

    describe('TeamInvitations Query', () => {
      it('should return pending invitations for team', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        // Register invitees
        await registerAndGetToken(inviteeUser);
        await registerAndGetToken(memberUser);

        // Create invitations
        await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: memberUser.email, role: 'admin' } },
          { authorization: `Bearer ${ownerToken}` }
        );

        const response = await testServer.executeOperation<GetTeamInvitationsResponse>(
          TEAM_INVITATIONS_QUERY,
          { teamId },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.teamInvitations.invitations).toHaveLength(2);
      });

      it('should not allow member to see invitations', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<GetTeamInvitationsResponse>(
          TEAM_INVITATIONS_QUERY,
          { teamId },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });
    });

    describe('MyInvitations Query', () => {
      it('should return pending invitations for current user', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const team1Id = await createTeam(ownerToken, { name: 'Team 1' });
        const team2Id = await createTeam(ownerToken, { name: 'Team 2' });

        const { accessToken: inviteeToken } = await registerAndGetToken(inviteeUser);

        // Create invitations to both teams
        await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId: team1Id, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId: team2Id, input: { email: inviteeUser.email, role: 'admin' } },
          { authorization: `Bearer ${ownerToken}` }
        );

        const response = await testServer.executeOperation<GetMyInvitationsResponse>(
          MY_INVITATIONS_QUERY,
          undefined,
          { authorization: `Bearer ${inviteeToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.myInvitations.invitations).toHaveLength(2);
        
        const teamNames = response.body.singleResult.data?.myInvitations.invitations.map(i => i.teamName);
        expect(teamNames).toContain('Team 1');
        expect(teamNames).toContain('Team 2');
      });
    });

    describe('AcceptInvitation Mutation', () => {
      it('should accept invitation and become team member', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: inviteeToken } = await registerAndGetToken(inviteeUser);

        const inviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        const invitationId = inviteResponse.body.singleResult.data!.createInvitation.invitation.id;

        const response = await testServer.executeOperation<AcceptInvitationResponse>(
          ACCEPT_INVITATION_MUTATION,
          { invitationId },
          { authorization: `Bearer ${inviteeToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.acceptInvitation.teamId).toBe(teamId);
        expect(response.body.singleResult.data?.acceptInvitation.role).toBe('member');

        // Verify user is now a member
        const myTeamsResponse = await testServer.executeOperation<GetMyTeamsResponse>(
          MY_TEAMS_QUERY,
          undefined,
          { authorization: `Bearer ${inviteeToken}` }
        );
        expect(myTeamsResponse.body.singleResult.data?.myTeams).toHaveLength(1);
        expect(myTeamsResponse.body.singleResult.data?.myTeams[0].role).toBe('member');
      });

      it('should not allow accepting invitation for another user', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        await registerAndGetToken(inviteeUser);
        const { accessToken: otherToken } = await registerAndGetToken(memberUser);

        const inviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        const invitationId = inviteResponse.body.singleResult.data!.createInvitation.invitation.id;

        const response = await testServer.executeOperation<AcceptInvitationResponse>(
          ACCEPT_INVITATION_MUTATION,
          { invitationId },
          { authorization: `Bearer ${otherToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVITATION_EMAIL_MISMATCH');
      });
    });

    describe('RejectInvitation Mutation', () => {
      it('should reject invitation', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: inviteeToken } = await registerAndGetToken(inviteeUser);

        const inviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        const invitationId = inviteResponse.body.singleResult.data!.createInvitation.invitation.id;

        const response = await testServer.executeOperation<RejectInvitationResponse>(
          REJECT_INVITATION_MUTATION,
          { invitationId },
          { authorization: `Bearer ${inviteeToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.rejectInvitation.success).toBe(true);

        // Verify invitation is no longer pending
        const myInvitationsResponse = await testServer.executeOperation<GetMyInvitationsResponse>(
          MY_INVITATIONS_QUERY,
          undefined,
          { authorization: `Bearer ${inviteeToken}` }
        );
        expect(myInvitationsResponse.body.singleResult.data?.myInvitations.invitations).toHaveLength(0);
      });
    });

    describe('CancelInvitation Mutation', () => {
      it('should cancel invitation as owner', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        await registerAndGetToken(inviteeUser);

        const inviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        const invitationId = inviteResponse.body.singleResult.data!.createInvitation.invitation.id;

        const response = await testServer.executeOperation<CancelInvitationResponse>(
          CANCEL_INVITATION_MUTATION,
          { teamId, invitationId },
          { authorization: `Bearer ${ownerToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.cancelInvitation.success).toBe(true);

        // Verify invitation is no longer in team invitations
        const teamInvitationsResponse = await testServer.executeOperation<GetTeamInvitationsResponse>(
          TEAM_INVITATIONS_QUERY,
          { teamId },
          { authorization: `Bearer ${ownerToken}` }
        );
        expect(teamInvitationsResponse.body.singleResult.data?.teamInvitations.invitations).toHaveLength(0);
      });

      it('should not allow member to cancel invitation', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        await registerAndGetToken(inviteeUser);

        const inviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
          CREATE_INVITATION_MUTATION,
          { teamId, input: { email: inviteeUser.email, role: 'member' } },
          { authorization: `Bearer ${ownerToken}` }
        );
        const invitationId = inviteResponse.body.singleResult.data!.createInvitation.invitation.id;

        const response = await testServer.executeOperation<CancelInvitationResponse>(
          CANCEL_INVITATION_MUTATION,
          { teamId, invitationId },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });
    });
  });

  // ============================================
  // Full Flow Integration Tests
  // ============================================
  describe('Integration Flows', () => {
    it('should complete full team creation and membership flow', async () => {
      // 1. Owner creates account and team
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);

      // 2. Admin is invited and accepts
      const { accessToken: adminToken } = await registerAndGetToken(adminUser);
      const adminInviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
        CREATE_INVITATION_MUTATION,
        { teamId, input: { email: adminUser.email, role: 'admin' } },
        { authorization: `Bearer ${ownerToken}` }
      );
      await testServer.executeOperation<AcceptInvitationResponse>(
        ACCEPT_INVITATION_MUTATION,
        { invitationId: adminInviteResponse.body.singleResult.data!.createInvitation.invitation.id },
        { authorization: `Bearer ${adminToken}` }
      );

      // 3. Member is invited by admin and accepts
      const { accessToken: memberToken } = await registerAndGetToken(memberUser);
      const memberInviteResponse = await testServer.executeOperation<CreateInvitationResponse>(
        CREATE_INVITATION_MUTATION,
        { teamId, input: { email: memberUser.email, role: 'member' } },
        { authorization: `Bearer ${adminToken}` }
      );
      await testServer.executeOperation<AcceptInvitationResponse>(
        ACCEPT_INVITATION_MUTATION,
        { invitationId: memberInviteResponse.body.singleResult.data!.createInvitation.invitation.id },
        { authorization: `Bearer ${memberToken}` }
      );

      // 4. Verify team has 3 members
      const membersResponse = await testServer.executeOperation<GetTeamMembersResponse>(
        TEAM_MEMBERS_QUERY,
        { teamId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(membersResponse.body.singleResult.data?.teamMembers.members).toHaveLength(3);

      // 5. Member views team from their perspective
      const teamResponse = await testServer.executeOperation<GetTeamResponse>(
        TEAM_QUERY,
        { id: teamId },
        { authorization: `Bearer ${memberToken}` }
      );
      expect(teamResponse.body.singleResult.data?.team?.role).toBe('member');
      expect(teamResponse.body.singleResult.data?.team?.memberCount).toBe(3);

      // 6. Member leaves team
      await testServer.executeOperation<LeaveTeamResponse>(
        LEAVE_TEAM_MUTATION,
        { teamId },
        { authorization: `Bearer ${memberToken}` }
      );

      // 7. Verify team now has 2 members
      const finalMembersResponse = await testServer.executeOperation<GetTeamMembersResponse>(
        TEAM_MEMBERS_QUERY,
        { teamId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(finalMembersResponse.body.singleResult.data?.teamMembers.members).toHaveLength(2);
    });
  });
});

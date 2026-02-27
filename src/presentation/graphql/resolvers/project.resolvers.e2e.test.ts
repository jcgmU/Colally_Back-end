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
  type CreateTeamResponse,
  CREATE_INVITATION_MUTATION,
  ACCEPT_INVITATION_MUTATION,
  type CreateInvitationResponse,
  type AcceptInvitationResponse,
  // Project operations
  CREATE_PROJECT_MUTATION,
  UPDATE_PROJECT_MUTATION,
  ARCHIVE_PROJECT_MUTATION,
  RESTORE_PROJECT_MUTATION,
  DELETE_PROJECT_MUTATION,
  REORDER_PROJECTS_MUTATION,
  PROJECT_QUERY,
  TEAM_PROJECTS_QUERY,
  // Project types
  type CreateProjectResponse,
  type UpdateProjectResponse,
  type ArchiveProjectResponse,
  type RestoreProjectResponse,
  type DeleteProjectResponse,
  type ReorderProjectsResponse,
  type GetProjectResponse,
  type GetTeamProjectsResponse,
} from '@shared/test/e2e/index.js';

describe('Project E2E Tests', () => {
  let testServer: TestServer;

  // Test users
  const ownerUser = {
    email: 'project-owner@example.com',
    password: 'SecurePass123!',
    name: 'Project Owner',
  };

  const adminUser = {
    email: 'project-admin@example.com',
    password: 'SecurePass123!',
    name: 'Project Admin',
  };

  const memberUser = {
    email: 'project-member@example.com',
    password: 'SecurePass123!',
    name: 'Project Member',
  };

  const nonMemberUser = {
    email: 'non-member@example.com',
    password: 'SecurePass123!',
    name: 'Non Member',
  };

  // Test team
  const testTeam = {
    name: 'Project Test Team',
    description: 'A team for project E2E testing',
  };

  // Test project
  const testProject = {
    name: 'Test Project',
    description: 'A project for E2E testing',
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

  // Helper to create a project
  async function createProject(
    accessToken: string,
    teamId: string,
    input: typeof testProject = testProject
  ): Promise<string> {
    const response = await testServer.executeOperation<CreateProjectResponse>(
      CREATE_PROJECT_MUTATION,
      { teamId, input },
      { authorization: `Bearer ${accessToken}` }
    );
    return response.body.singleResult.data!.createProject.project.id;
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
  // Project CRUD Tests
  // ============================================
  describe('Project CRUD', () => {
    describe('CreateProject Mutation', () => {
      it('should create project successfully', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        const response = await testServer.executeOperation<CreateProjectResponse>(
          CREATE_PROJECT_MUTATION,
          { teamId, input: testProject },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.createProject.project).toBeDefined();
        expect(response.body.singleResult.data?.createProject.project.name).toBe(testProject.name);
        expect(response.body.singleResult.data?.createProject.project.description).toBe(testProject.description);
        expect(response.body.singleResult.data?.createProject.project.status).toBe('active');
        expect(response.body.singleResult.data?.createProject.project.position).toBe(0);
        expect(response.body.singleResult.data?.createProject.project.teamId).toBe(teamId);
      });

      it('should require authentication for createProject', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        const response = await testServer.executeOperation<CreateProjectResponse>(
          CREATE_PROJECT_MUTATION,
          { teamId, input: testProject }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
      });

      it('should allow admin to create project', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: adminToken } = await registerAndGetToken(adminUser);
        await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

        const response = await testServer.executeOperation<CreateProjectResponse>(
          CREATE_PROJECT_MUTATION,
          { teamId, input: { name: 'Admin Project' } },
          { authorization: `Bearer ${adminToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.createProject.project.name).toBe('Admin Project');
      });

      it('should not allow member to create project', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<CreateProjectResponse>(
          CREATE_PROJECT_MUTATION,
          { teamId, input: testProject },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });
    });

    describe('Project Query', () => {
      it('should get project by ID', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);
        const projectId = await createProject(accessToken, teamId);

        const response = await testServer.executeOperation<GetProjectResponse>(
          PROJECT_QUERY,
          { id: projectId },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.project).toBeDefined();
        expect(response.body.singleResult.data?.project?.project.id).toBe(projectId);
        expect(response.body.singleResult.data?.project?.project.name).toBe(testProject.name);
      });

      it('should return error for non-existent project', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        await createTeam(accessToken);

        const response = await testServer.executeOperation<GetProjectResponse>(
          PROJECT_QUERY,
          { id: '00000000-0000-0000-0000-000000000000' },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('PROJECT_NOT_FOUND');
      });
    });

    describe('TeamProjects Query', () => {
      it('should get team projects', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        // Create multiple projects
        await createProject(accessToken, teamId, { name: 'Project 1' });
        await createProject(accessToken, teamId, { name: 'Project 2' });
        await createProject(accessToken, teamId, { name: 'Project 3' });

        const response = await testServer.executeOperation<GetTeamProjectsResponse>(
          TEAM_PROJECTS_QUERY,
          { teamId },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.teamProjects.projects).toHaveLength(3);
      });

      it('should filter archived projects by default', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        const projectId = await createProject(accessToken, teamId, { name: 'Active Project' });
        const archivedId = await createProject(accessToken, teamId, { name: 'Archived Project' });

        // Archive one project
        await testServer.executeOperation<ArchiveProjectResponse>(
          ARCHIVE_PROJECT_MUTATION,
          { projectId: archivedId },
          { authorization: `Bearer ${accessToken}` }
        );

        const response = await testServer.executeOperation<GetTeamProjectsResponse>(
          TEAM_PROJECTS_QUERY,
          { teamId },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.teamProjects.projects).toHaveLength(1);
        expect(response.body.singleResult.data?.teamProjects.projects[0].id).toBe(projectId);
      });

      it('should include archived projects when requested', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);

        await createProject(accessToken, teamId, { name: 'Active Project' });
        const archivedId = await createProject(accessToken, teamId, { name: 'Archived Project' });

        // Archive one project
        await testServer.executeOperation<ArchiveProjectResponse>(
          ARCHIVE_PROJECT_MUTATION,
          { projectId: archivedId },
          { authorization: `Bearer ${accessToken}` }
        );

        const response = await testServer.executeOperation<GetTeamProjectsResponse>(
          TEAM_PROJECTS_QUERY,
          { teamId, includeArchived: true },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.teamProjects.projects).toHaveLength(2);
      });
    });

    describe('UpdateProject Mutation', () => {
      it('should update project successfully', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);
        const projectId = await createProject(accessToken, teamId);

        const response = await testServer.executeOperation<UpdateProjectResponse>(
          UPDATE_PROJECT_MUTATION,
          { projectId, input: { name: 'Updated Name', description: 'Updated desc' } },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.updateProject.project.name).toBe('Updated Name');
        expect(response.body.singleResult.data?.updateProject.project.description).toBe('Updated desc');
      });

      it('should not allow member to update project', async () => {
        const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(ownerToken);
        const projectId = await createProject(ownerToken, teamId);

        const { accessToken: memberToken } = await registerAndGetToken(memberUser);
        await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

        const response = await testServer.executeOperation<UpdateProjectResponse>(
          UPDATE_PROJECT_MUTATION,
          { projectId, input: { name: 'Member Updated' } },
          { authorization: `Bearer ${memberToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
      });

      it('should not allow updating archived project', async () => {
        const { accessToken } = await registerAndGetToken(ownerUser);
        const teamId = await createTeam(accessToken);
        const projectId = await createProject(accessToken, teamId);

        // Archive the project
        await testServer.executeOperation<ArchiveProjectResponse>(
          ARCHIVE_PROJECT_MUTATION,
          { projectId },
          { authorization: `Bearer ${accessToken}` }
        );

        const response = await testServer.executeOperation<UpdateProjectResponse>(
          UPDATE_PROJECT_MUTATION,
          { projectId, input: { name: 'Should Fail' } },
          { authorization: `Bearer ${accessToken}` }
        );

        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('CANNOT_UPDATE_ARCHIVED_PROJECT');
      });
    });
  });

  // ============================================
  // Archive/Restore Tests
  // ============================================
  describe('Archive/Restore', () => {
    it('should archive project successfully', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);
      const projectId = await createProject(accessToken, teamId);

      const response = await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.archiveProject.project.status).toBe('archived');
    });

    it('should not allow member to archive project', async () => {
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);
      const projectId = await createProject(ownerToken, teamId);

      const { accessToken: memberToken } = await registerAndGetToken(memberUser);
      await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

      const response = await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${memberToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
    });

    it('should return error when archiving already archived project', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);
      const projectId = await createProject(accessToken, teamId);

      // Archive first time
      await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${accessToken}` }
      );

      // Try to archive again
      const response = await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('PROJECT_ALREADY_ARCHIVED');
    });

    it('should restore archived project successfully', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);
      const projectId = await createProject(accessToken, teamId);

      // Archive first
      await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${accessToken}` }
      );

      // Restore
      const response = await testServer.executeOperation<RestoreProjectResponse>(
        RESTORE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.restoreProject.project.status).toBe('active');
    });

    it('should assign next position when restoring', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);

      // Create projects: first will get position 0
      const project1Id = await createProject(accessToken, teamId, { name: 'Project 1' });
      await createProject(accessToken, teamId, { name: 'Project 2' }); // position 1

      // Archive project1
      await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId: project1Id },
        { authorization: `Bearer ${accessToken}` }
      );

      // Restore project1 - should get position 2 (next available)
      const response = await testServer.executeOperation<RestoreProjectResponse>(
        RESTORE_PROJECT_MUTATION,
        { projectId: project1Id },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.restoreProject.project.position).toBe(2);
    });
  });

  // ============================================
  // Delete Tests
  // ============================================
  describe('Delete', () => {
    it('should delete project when user is owner', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);
      const projectId = await createProject(accessToken, teamId);

      const response = await testServer.executeOperation<DeleteProjectResponse>(
        DELETE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.deleteProject.success).toBe(true);

      // Verify project is deleted
      const getResponse = await testServer.executeOperation<GetProjectResponse>(
        PROJECT_QUERY,
        { id: projectId },
        { authorization: `Bearer ${accessToken}` }
      );
      expect(getResponse.body.singleResult.errors).toBeDefined();
      expect(getResponse.body.singleResult.errors?.[0]?.extensions?.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should not allow admin to delete project', async () => {
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);
      const projectId = await createProject(ownerToken, teamId);

      const { accessToken: adminToken } = await registerAndGetToken(adminUser);
      await inviteAndAccept(ownerToken, teamId, adminUser.email, adminToken, 'admin');

      const response = await testServer.executeOperation<DeleteProjectResponse>(
        DELETE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${adminToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
    });

    it('should not allow member to delete project', async () => {
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);
      const projectId = await createProject(ownerToken, teamId);

      const { accessToken: memberToken } = await registerAndGetToken(memberUser);
      await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

      const response = await testServer.executeOperation<DeleteProjectResponse>(
        DELETE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${memberToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
    });
  });

  // ============================================
  // Reorder Tests
  // ============================================
  describe('Reorder', () => {
    it('should reorder projects successfully', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);

      // Create projects
      const project1Id = await createProject(accessToken, teamId, { name: 'Project 1' });
      const project2Id = await createProject(accessToken, teamId, { name: 'Project 2' });
      const project3Id = await createProject(accessToken, teamId, { name: 'Project 3' });

      // Reorder: reverse order
      const response = await testServer.executeOperation<ReorderProjectsResponse>(
        REORDER_PROJECTS_MUTATION,
        { teamId, input: { projectIds: [project3Id, project2Id, project1Id] } },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.reorderProjects.success).toBe(true);

      // Verify new order
      const getResponse = await testServer.executeOperation<GetTeamProjectsResponse>(
        TEAM_PROJECTS_QUERY,
        { teamId },
        { authorization: `Bearer ${accessToken}` }
      );

      const projects = getResponse.body.singleResult.data?.teamProjects.projects;
      // Projects should be ordered by position
      expect(projects?.[0].id).toBe(project3Id);
      expect(projects?.[1].id).toBe(project2Id);
      expect(projects?.[2].id).toBe(project1Id);
    });

    it('should not allow member to reorder projects', async () => {
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);

      const project1Id = await createProject(ownerToken, teamId, { name: 'Project 1' });
      const project2Id = await createProject(ownerToken, teamId, { name: 'Project 2' });

      const { accessToken: memberToken } = await registerAndGetToken(memberUser);
      await inviteAndAccept(ownerToken, teamId, memberUser.email, memberToken, 'member');

      const response = await testServer.executeOperation<ReorderProjectsResponse>(
        REORDER_PROJECTS_MUTATION,
        { teamId, input: { projectIds: [project2Id, project1Id] } },
        { authorization: `Bearer ${memberToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INSUFFICIENT_PERMISSION');
    });

    it('should return error for invalid project IDs', async () => {
      const { accessToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(accessToken);

      const project1Id = await createProject(accessToken, teamId, { name: 'Project 1' });

      const response = await testServer.executeOperation<ReorderProjectsResponse>(
        REORDER_PROJECTS_MUTATION,
        { teamId, input: { projectIds: [project1Id, '00000000-0000-0000-0000-000000000000'] } },
        { authorization: `Bearer ${accessToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('REORDER_PROJECTS_INVALID');
    });
  });

  // ============================================
  // Authorization Tests
  // ============================================
  describe('Authorization', () => {
    it('should return error when non-member tries to access project', async () => {
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);
      const projectId = await createProject(ownerToken, teamId);

      const { accessToken: nonMemberToken } = await registerAndGetToken(nonMemberUser);

      const response = await testServer.executeOperation<GetProjectResponse>(
        PROJECT_QUERY,
        { id: projectId },
        { authorization: `Bearer ${nonMemberToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('NOT_MEMBER');
    });

    it('should return error when non-member tries to access team projects', async () => {
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);
      await createProject(ownerToken, teamId);

      const { accessToken: nonMemberToken } = await registerAndGetToken(nonMemberUser);

      const response = await testServer.executeOperation<GetTeamProjectsResponse>(
        TEAM_PROJECTS_QUERY,
        { teamId },
        { authorization: `Bearer ${nonMemberToken}` }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('NOT_MEMBER');
    });
  });

  // ============================================
  // Full Flow Integration Tests
  // ============================================
  describe('Integration Flows', () => {
    it('should complete full project lifecycle (create -> update -> archive -> restore -> delete)', async () => {
      // 1. Owner creates account and team
      const { accessToken: ownerToken } = await registerAndGetToken(ownerUser);
      const teamId = await createTeam(ownerToken);

      // 2. Create project
      const createResponse = await testServer.executeOperation<CreateProjectResponse>(
        CREATE_PROJECT_MUTATION,
        { teamId, input: { name: 'Lifecycle Project', description: 'Testing lifecycle' } },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(createResponse.body.singleResult.errors).toBeUndefined();
      const projectId = createResponse.body.singleResult.data!.createProject.project.id;
      expect(createResponse.body.singleResult.data!.createProject.project.status).toBe('active');

      // 3. Update project
      const updateResponse = await testServer.executeOperation<UpdateProjectResponse>(
        UPDATE_PROJECT_MUTATION,
        { projectId, input: { name: 'Updated Lifecycle Project', description: 'Updated description' } },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(updateResponse.body.singleResult.errors).toBeUndefined();
      expect(updateResponse.body.singleResult.data!.updateProject.project.name).toBe('Updated Lifecycle Project');

      // 4. Archive project
      const archiveResponse = await testServer.executeOperation<ArchiveProjectResponse>(
        ARCHIVE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(archiveResponse.body.singleResult.errors).toBeUndefined();
      expect(archiveResponse.body.singleResult.data!.archiveProject.project.status).toBe('archived');

      // 5. Verify project is not in active list
      const activeListResponse = await testServer.executeOperation<GetTeamProjectsResponse>(
        TEAM_PROJECTS_QUERY,
        { teamId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(activeListResponse.body.singleResult.data?.teamProjects.projects).toHaveLength(0);

      // 6. Restore project
      const restoreResponse = await testServer.executeOperation<RestoreProjectResponse>(
        RESTORE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(restoreResponse.body.singleResult.errors).toBeUndefined();
      expect(restoreResponse.body.singleResult.data!.restoreProject.project.status).toBe('active');

      // 7. Verify project is back in active list
      const restoredListResponse = await testServer.executeOperation<GetTeamProjectsResponse>(
        TEAM_PROJECTS_QUERY,
        { teamId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(restoredListResponse.body.singleResult.data?.teamProjects.projects).toHaveLength(1);

      // 8. Delete project
      const deleteResponse = await testServer.executeOperation<DeleteProjectResponse>(
        DELETE_PROJECT_MUTATION,
        { projectId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(deleteResponse.body.singleResult.errors).toBeUndefined();
      expect(deleteResponse.body.singleResult.data!.deleteProject.success).toBe(true);

      // 9. Verify project no longer exists
      const finalGetResponse = await testServer.executeOperation<GetProjectResponse>(
        PROJECT_QUERY,
        { id: projectId },
        { authorization: `Bearer ${ownerToken}` }
      );
      expect(finalGetResponse.body.singleResult.errors).toBeDefined();
      expect(finalGetResponse.body.singleResult.errors?.[0]?.extensions?.code).toBe('PROJECT_NOT_FOUND');
    });
  });
});

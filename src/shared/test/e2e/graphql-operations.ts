/**
 * GraphQL operations for E2E tests
 */

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        name
        isActive
        createdAt
        updatedAt
      }
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        name
        isActive
        createdAt
        updatedAt
      }
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout($input: LogoutInput!) {
    logout(input: $input) {
      success
    }
  }
`;

/**
 * Type definitions for GraphQL responses
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayloadResponse {
  user: UserResponse;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterResponse {
  register: AuthPayloadResponse;
}

export interface LoginResponse {
  login: AuthPayloadResponse;
}

export interface MeResponse {
  me: UserResponse | null;
}

export interface RefreshTokenResponse {
  refreshToken: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface LogoutResponse {
  logout: {
    success: boolean;
  };
}

// ============================================
// Team GraphQL Operations
// ============================================

// Queries
export const TEAM_QUERY = `
  query Team($id: ID!) {
    team(id: $id) {
      team {
        id
        name
        description
        createdAt
        updatedAt
      }
      role
      memberCount
    }
  }
`;

export const MY_TEAMS_QUERY = `
  query MyTeams {
    myTeams {
      team {
        id
        name
        description
        createdAt
        updatedAt
      }
      role
    }
  }
`;

export const TEAM_MEMBERS_QUERY = `
  query TeamMembers($teamId: ID!) {
    teamMembers(teamId: $teamId) {
      members {
        id
        userId
        userName
        userEmail
        userAvatarUrl
        role
        joinedAt
      }
    }
  }
`;

export const TEAM_INVITATIONS_QUERY = `
  query TeamInvitations($teamId: ID!) {
    teamInvitations(teamId: $teamId) {
      invitations {
        id
        teamId
        email
        role
        status
        invitedBy
        inviterName
        expiresAt
        createdAt
      }
    }
  }
`;

export const MY_INVITATIONS_QUERY = `
  query MyInvitations {
    myInvitations {
      invitations {
        invitation {
          id
          teamId
          email
          role
          status
          invitedBy
          expiresAt
          createdAt
        }
        teamName
        inviterName
      }
    }
  }
`;

// Mutations
export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      team {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_TEAM_MUTATION = `
  mutation UpdateTeam($teamId: ID!, $input: UpdateTeamInput!) {
    updateTeam(teamId: $teamId, input: $input) {
      team {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($teamId: ID!) {
    deleteTeam(teamId: $teamId) {
      success
    }
  }
`;

export const CHANGE_MEMBER_ROLE_MUTATION = `
  mutation ChangeMemberRole($teamId: ID!, $userId: ID!, $input: ChangeMemberRoleInput!) {
    changeMemberRole(teamId: $teamId, userId: $userId, input: $input) {
      member {
        id
        userId
        userName
        userEmail
        role
        joinedAt
      }
    }
  }
`;

export const REMOVE_MEMBER_MUTATION = `
  mutation RemoveMember($teamId: ID!, $userId: ID!) {
    removeMember(teamId: $teamId, userId: $userId) {
      success
    }
  }
`;

export const LEAVE_TEAM_MUTATION = `
  mutation LeaveTeam($teamId: ID!) {
    leaveTeam(teamId: $teamId) {
      success
    }
  }
`;

export const CREATE_INVITATION_MUTATION = `
  mutation CreateInvitation($teamId: ID!, $input: CreateInvitationInput!) {
    createInvitation(teamId: $teamId, input: $input) {
      invitation {
        id
        teamId
        email
        role
        status
        invitedBy
        expiresAt
        createdAt
      }
    }
  }
`;

export const ACCEPT_INVITATION_MUTATION = `
  mutation AcceptInvitation($invitationId: ID!) {
    acceptInvitation(invitationId: $invitationId) {
      teamId
      teamName
      role
    }
  }
`;

export const REJECT_INVITATION_MUTATION = `
  mutation RejectInvitation($invitationId: ID!) {
    rejectInvitation(invitationId: $invitationId) {
      success
    }
  }
`;

export const CANCEL_INVITATION_MUTATION = `
  mutation CancelInvitation($teamId: ID!, $invitationId: ID!) {
    cancelInvitation(teamId: $teamId, invitationId: $invitationId) {
      success
    }
  }
`;

// ============================================
// Team Response Types
// ============================================

export interface TeamResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetailResponse {
  team: TeamResponse;
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
}

export interface TeamWithRoleResponse {
  team: TeamResponse;
  role: 'owner' | 'admin' | 'member';
}

export interface MemberResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface InvitationResponse {
  id: string;
  teamId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invitedBy: string;
  inviterName?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationWithTeamResponse {
  invitation: InvitationResponse;
  teamName: string;
  inviterName: string;
}

// Query Responses
export interface GetTeamResponse {
  team: TeamDetailResponse | null;
}

export interface GetMyTeamsResponse {
  myTeams: TeamWithRoleResponse[];
}

export interface GetTeamMembersResponse {
  teamMembers: {
    members: MemberResponse[];
  };
}

export interface GetTeamInvitationsResponse {
  teamInvitations: {
    invitations: InvitationResponse[];
  };
}

export interface GetMyInvitationsResponse {
  myInvitations: {
    invitations: InvitationWithTeamResponse[];
  };
}

// Mutation Responses
export interface CreateTeamResponse {
  createTeam: {
    team: TeamResponse;
  };
}

export interface UpdateTeamResponse {
  updateTeam: {
    team: TeamResponse;
  };
}

export interface DeleteTeamResponse {
  deleteTeam: {
    success: boolean;
  };
}

export interface ChangeMemberRoleResponse {
  changeMemberRole: {
    member: MemberResponse;
  };
}

export interface RemoveMemberResponse {
  removeMember: {
    success: boolean;
  };
}

export interface LeaveTeamResponse {
  leaveTeam: {
    success: boolean;
  };
}

export interface CreateInvitationResponse {
  createInvitation: {
    invitation: InvitationResponse;
  };
}

export interface AcceptInvitationResponse {
  acceptInvitation: {
    teamId: string;
    teamName: string;
    role: 'owner' | 'admin' | 'member';
  };
}

export interface RejectInvitationResponse {
  rejectInvitation: {
    success: boolean;
  };
}

export interface CancelInvitationResponse {
  cancelInvitation: {
    success: boolean;
  };
}

// ============================================
// Project GraphQL Operations
// ============================================

// Queries
export const PROJECT_QUERY = `
  query Project($id: ID!) {
    project(id: $id) {
      project {
        id
        teamId
        name
        description
        status
        position
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const TEAM_PROJECTS_QUERY = `
  query TeamProjects($teamId: ID!, $includeArchived: Boolean) {
    teamProjects(teamId: $teamId, includeArchived: $includeArchived) {
      projects {
        id
        teamId
        name
        description
        status
        position
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

// Mutations
export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($teamId: ID!, $input: CreateProjectInput!) {
    createProject(teamId: $teamId, input: $input) {
      project {
        id
        teamId
        name
        description
        status
        position
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($projectId: ID!, $input: UpdateProjectInput!) {
    updateProject(projectId: $projectId, input: $input) {
      project {
        id
        teamId
        name
        description
        status
        position
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const ARCHIVE_PROJECT_MUTATION = `
  mutation ArchiveProject($projectId: ID!) {
    archiveProject(projectId: $projectId) {
      project {
        id
        teamId
        name
        description
        status
        position
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const RESTORE_PROJECT_MUTATION = `
  mutation RestoreProject($projectId: ID!) {
    restoreProject(projectId: $projectId) {
      project {
        id
        teamId
        name
        description
        status
        position
        createdBy
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_PROJECT_MUTATION = `
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId) {
      success
    }
  }
`;

export const REORDER_PROJECTS_MUTATION = `
  mutation ReorderProjects($teamId: ID!, $input: ReorderProjectsInput!) {
    reorderProjects(teamId: $teamId, input: $input) {
      success
    }
  }
`;

// ============================================
// Project Response Types
// ============================================

export interface ProjectData {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Query Responses
export interface GetProjectResponse {
  project: {
    project: ProjectData;
  } | null;
}

export interface GetTeamProjectsResponse {
  teamProjects: {
    projects: ProjectData[];
  };
}

// Mutation Responses
export interface CreateProjectResponse {
  createProject: {
    project: ProjectData;
  };
}

export interface UpdateProjectResponse {
  updateProject: {
    project: ProjectData;
  };
}

export interface ArchiveProjectResponse {
  archiveProject: {
    project: ProjectData;
  };
}

export interface RestoreProjectResponse {
  restoreProject: {
    project: ProjectData;
  };
}

export interface DeleteProjectResponse {
  deleteProject: {
    success: boolean;
  };
}

export interface ReorderProjectsResponse {
  reorderProjects: {
    success: boolean;
  };
}

/**
 * GraphQL Type Definitions for Project Module
 */
export const projectTypeDefs = `#graphql
  # ============================================
  # Enums
  # ============================================

  enum ProjectStatus {
    active
    archived
  }

  # ============================================
  # Types
  # ============================================

  type Project {
    id: ID!
    teamId: ID!
    name: String!
    description: String
    status: ProjectStatus!
    position: Int!
    createdBy: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ============================================
  # Inputs
  # ============================================

  input CreateProjectInput {
    name: String!
    description: String
  }

  input UpdateProjectInput {
    name: String
    description: String
  }

  input ReorderProjectsInput {
    projectIds: [ID!]!
  }

  # ============================================
  # Payloads
  # ============================================

  type ProjectPayload {
    project: Project!
  }

  type ProjectListPayload {
    projects: [Project!]!
  }

  type ProjectDeletePayload {
    success: Boolean!
  }

  type ReorderProjectsPayload {
    success: Boolean!
  }

  # ============================================
  # Queries
  # ============================================

  extend type Query {
    """
    Get a project by ID (requires team membership)
    """
    project(id: ID!): ProjectPayload

    """
    Get all projects for a team (requires team membership)
    """
    teamProjects(teamId: ID!, includeArchived: Boolean): ProjectListPayload!
  }

  # ============================================
  # Mutations
  # ============================================

  extend type Mutation {
    """
    Create a new project in a team (requires admin/owner)
    """
    createProject(teamId: ID!, input: CreateProjectInput!): ProjectPayload!

    """
    Update a project (requires admin/owner)
    """
    updateProject(projectId: ID!, input: UpdateProjectInput!): ProjectPayload!

    """
    Archive a project (requires admin/owner)
    """
    archiveProject(projectId: ID!): ProjectPayload!

    """
    Restore an archived project (requires admin/owner)
    """
    restoreProject(projectId: ID!): ProjectPayload!

    """
    Delete a project permanently (requires owner only)
    """
    deleteProject(projectId: ID!): ProjectDeletePayload!

    """
    Reorder all active projects in a team (requires admin/owner)
    """
    reorderProjects(teamId: ID!, input: ReorderProjectsInput!): ReorderProjectsPayload!
  }
`;

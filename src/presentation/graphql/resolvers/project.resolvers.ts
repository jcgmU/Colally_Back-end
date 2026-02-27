import { GraphQLError } from 'graphql';
import { container } from 'tsyringe';

import {
  CreateProjectUseCase,
  GetProjectUseCase,
  GetTeamProjectsUseCase,
  UpdateProjectUseCase,
  ArchiveProjectUseCase,
  RestoreProjectUseCase,
  DeleteProjectUseCase,
  ReorderProjectsUseCase,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ReorderProjectsInput,
} from '@application/project/index.js';
import { ProjectDomainError } from '@domain/project/errors/project.errors.js';
import { DomainError } from '@shared/errors/index.js';

import { type GraphQLContext, requireAuth } from '../middleware/index.js';

/**
 * Convert domain errors to GraphQL errors
 */
function handleError(error: unknown): never {
  // Handle ProjectDomainError (extends Error, not DomainError)
  if (error instanceof ProjectDomainError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
      },
    });
  }

  // Handle shared DomainError (NotTeamMemberError, InsufficientTeamPermissionError, etc.)
  if (error instanceof DomainError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
      },
    });
  }

  // Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    throw new GraphQLError('Validation error', {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message),
      },
    });
  }

  // Unknown errors
  console.error('Unexpected error:', error);
  throw new GraphQLError('Internal server error', {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}

/**
 * Project Resolvers
 */
export const projectResolvers = {
  Query: {
    project: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetProjectUseCase);
        const project = await useCase.execute(context.user.userId, args.id);
        return { project };
      } catch (error) {
        handleError(error);
      }
    },

    teamProjects: async (
      _parent: unknown,
      args: { teamId: string; includeArchived?: boolean },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetTeamProjectsUseCase);
        const projects = await useCase.execute(context.user.userId, args.teamId, {
          includeArchived: args.includeArchived ?? false,
        });
        return { projects };
      } catch (error) {
        handleError(error);
      }
    },
  },

  Mutation: {
    createProject: async (
      _parent: unknown,
      args: { teamId: string; input: CreateProjectInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(CreateProjectUseCase);
        const project = await useCase.execute(
          context.user.userId,
          args.teamId,
          args.input
        );
        return { project };
      } catch (error) {
        handleError(error);
      }
    },

    updateProject: async (
      _parent: unknown,
      args: { projectId: string; input: UpdateProjectInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(UpdateProjectUseCase);
        const project = await useCase.execute(
          context.user.userId,
          args.projectId,
          args.input
        );
        return { project };
      } catch (error) {
        handleError(error);
      }
    },

    archiveProject: async (
      _parent: unknown,
      args: { projectId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(ArchiveProjectUseCase);
        const project = await useCase.execute(args.projectId, context.user.userId);
        return { project };
      } catch (error) {
        handleError(error);
      }
    },

    restoreProject: async (
      _parent: unknown,
      args: { projectId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(RestoreProjectUseCase);
        const project = await useCase.execute(args.projectId, context.user.userId);
        return { project };
      } catch (error) {
        handleError(error);
      }
    },

    deleteProject: async (
      _parent: unknown,
      args: { projectId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(DeleteProjectUseCase);
        const result = await useCase.execute(args.projectId, context.user.userId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    reorderProjects: async (
      _parent: unknown,
      args: { teamId: string; input: ReorderProjectsInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(ReorderProjectsUseCase);
        const result = await useCase.execute(args.teamId, args.input, context.user.userId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },
  },
};

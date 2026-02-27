import { GraphQLError } from 'graphql';
import { container } from 'tsyringe';

import {
  CreateTeamUseCase,
  GetTeamUseCase,
  UpdateTeamUseCase,
  DeleteTeamUseCase,
  GetMyTeamsUseCase,
  GetTeamMembersUseCase,
  ChangeMemberRoleUseCase,
  RemoveMemberUseCase,
  LeaveTeamUseCase,
  CreateInvitationUseCase,
  GetTeamInvitationsUseCase,
  GetMyInvitationsUseCase,
  AcceptInvitationUseCase,
  RejectInvitationUseCase,
  CancelInvitationUseCase,
  type CreateTeamInput,
  type UpdateTeamInput,
  type ChangeMemberRoleInput,
  type CreateInvitationInput,
} from '@application/team/index.js';
import { TeamDomainError } from '@domain/team/errors/team.errors.js';

import { type GraphQLContext, requireAuth } from '../middleware/index.js';

/**
 * Convert domain errors to GraphQL errors
 */
function handleError(error: unknown): never {
  if (error instanceof TeamDomainError) {
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
 * Team Resolvers
 */
export const teamResolvers = {
  Query: {
    team: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetTeamUseCase);
        const result = await useCase.execute(context.user.userId, args.id);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    myTeams: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetMyTeamsUseCase);
        const result = await useCase.execute(context.user.userId);
        return result.teams;
      } catch (error) {
        handleError(error);
      }
    },

    teamMembers: async (
      _parent: unknown,
      args: { teamId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetTeamMembersUseCase);
        const result = await useCase.execute(context.user.userId, args.teamId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    teamInvitations: async (
      _parent: unknown,
      args: { teamId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetTeamInvitationsUseCase);
        const result = await useCase.execute(context.user.userId, args.teamId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    myInvitations: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(GetMyInvitationsUseCase);
        const result = await useCase.execute(context.user.userId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },
  },

  Mutation: {
    createTeam: async (
      _parent: unknown,
      args: { input: CreateTeamInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(CreateTeamUseCase);
        const result = await useCase.execute(context.user.userId, args.input);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    updateTeam: async (
      _parent: unknown,
      args: { teamId: string; input: UpdateTeamInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(UpdateTeamUseCase);
        const result = await useCase.execute(context.user.userId, args.teamId, args.input);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    deleteTeam: async (
      _parent: unknown,
      args: { teamId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(DeleteTeamUseCase);
        const result = await useCase.execute(context.user.userId, args.teamId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    changeMemberRole: async (
      _parent: unknown,
      args: { teamId: string; userId: string; input: ChangeMemberRoleInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(ChangeMemberRoleUseCase);
        const result = await useCase.execute(
          context.user.userId,
          args.teamId,
          args.userId,
          args.input
        );
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    removeMember: async (
      _parent: unknown,
      args: { teamId: string; userId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(RemoveMemberUseCase);
        const result = await useCase.execute(
          context.user.userId,
          args.teamId,
          args.userId
        );
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    leaveTeam: async (
      _parent: unknown,
      args: { teamId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(LeaveTeamUseCase);
        const result = await useCase.execute(context.user.userId, args.teamId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    createInvitation: async (
      _parent: unknown,
      args: { teamId: string; input: CreateInvitationInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(CreateInvitationUseCase);
        const result = await useCase.execute(
          context.user.userId,
          args.teamId,
          args.input
        );
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    acceptInvitation: async (
      _parent: unknown,
      args: { invitationId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(AcceptInvitationUseCase);
        const result = await useCase.execute(context.user.userId, args.invitationId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    rejectInvitation: async (
      _parent: unknown,
      args: { invitationId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(RejectInvitationUseCase);
        const result = await useCase.execute(context.user.userId, args.invitationId);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    cancelInvitation: async (
      _parent: unknown,
      args: { teamId: string; invitationId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const useCase = container.resolve(CancelInvitationUseCase);
        const result = await useCase.execute(
          context.user.userId,
          args.teamId,
          args.invitationId
        );
        return result;
      } catch (error) {
        handleError(error);
      }
    },
  },
};

import { GraphQLError } from 'graphql';
import { container } from 'tsyringe';

import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  GetCurrentUserUseCase,
  type RegisterUserInput,
  type LoginUserInput,
  type RefreshTokenInput,
  type LogoutInput,
} from '@application/auth/index.js';
import { DomainError } from '@shared/errors/domain-error.js';

import { type GraphQLContext, requireAuth } from '../middleware/index.js';

/**
 * Convert domain errors to GraphQL errors
 */
function handleError(error: unknown): never {
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
 * Auth Resolvers
 */
export const authResolvers = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<{ id: string; email: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date } | null> => {
      if (context.user === null) {
        return null;
      }

      try {
        const useCase = container.resolve(GetCurrentUserUseCase);
        const result = await useCase.execute(context.user.userId);
        return result.user;
      } catch (error) {
        handleError(error);
      }
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: { input: RegisterUserInput }
    ): Promise<{
      user: { id: string; email: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date };
      tokens: { accessToken: string; refreshToken: string };
    }> => {
      try {
        const useCase = container.resolve(RegisterUserUseCase);
        const result = await useCase.execute(args.input);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    login: async (
      _parent: unknown,
      args: { input: LoginUserInput }
    ): Promise<{
      user: { id: string; email: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date };
      tokens: { accessToken: string; refreshToken: string };
    }> => {
      try {
        const useCase = container.resolve(LoginUserUseCase);
        const result = await useCase.execute(args.input);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    refreshToken: async (
      _parent: unknown,
      args: { input: RefreshTokenInput }
    ): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
      try {
        const useCase = container.resolve(RefreshTokenUseCase);
        const result = await useCase.execute(args.input);
        return result;
      } catch (error) {
        handleError(error);
      }
    },

    logout: async (
      _parent: unknown,
      args: { input: LogoutInput },
      context: GraphQLContext
    ): Promise<{ success: boolean }> => {
      requireAuth(context);

      try {
        const useCase = container.resolve(LogoutUseCase);
        const result = await useCase.execute(args.input);
        return result;
      } catch (error) {
        handleError(error);
      }
    },
  },
};

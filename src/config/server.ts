import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { container } from 'tsyringe';

import { getEnv } from '@config/env.js';
import { TOKEN_SERVICE_TOKEN, type ITokenService } from '@domain/auth/ports/index.js';
import {
  authTypeDefs,
  scalarResolvers,
  authResolvers,
  type GraphQLContext,
} from '@presentation/graphql/index.js';

/**
 * Create and configure the Apollo Server
 */
export async function createApolloServer(): Promise<{
  server: ApolloServer<GraphQLContext>;
  url: string;
}> {
  const env = getEnv();

  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs: authTypeDefs,
    resolvers: {
      ...scalarResolvers,
      ...authResolvers,
    },
  });

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    schema,
    formatError: (formattedError): { message: string; extensions?: Record<string, unknown> } => {
      // Don't expose internal errors in production
      if (
        env.NODE_ENV === 'production' &&
        formattedError.extensions?.['code'] === 'INTERNAL_SERVER_ERROR'
      ) {
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }
      return formattedError;
    },
  });

  // Start standalone server
  const { url } = await startStandaloneServer(server, {
    listen: { port: env.PORT },
    context: async ({ req }): Promise<GraphQLContext> => {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith('Bearer ') !== true) {
        return Promise.resolve({ user: null });
      }

      const token = authHeader.slice(7); // Remove 'Bearer ' prefix

      try {
        const tokenService = container.resolve<ITokenService>(TOKEN_SERVICE_TOKEN);
        const payload = tokenService.verifyAccessToken(token);
        return Promise.resolve({ user: payload });
      } catch {
        // Invalid token - continue without authentication
        return Promise.resolve({ user: null });
      }
    },
  });

  return { server, url };
}

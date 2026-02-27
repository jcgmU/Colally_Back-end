/**
 * E2E Test Server
 * Creates an isolated Apollo Server instance for E2E testing
 */
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { container } from 'tsyringe';

import { configureDI } from '@config/di.js';
import { TOKEN_SERVICE_TOKEN, type ITokenService } from '@domain/auth/ports/index.js';
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';
import { RedisService, REDIS_SERVICE_TOKEN } from '@infrastructure/redis/index.js';
import {
  authTypeDefs,
  scalarResolvers,
  authResolvers,
  type GraphQLContext,
} from '@presentation/graphql/index.js';

export interface TestServer {
  server: ApolloServer<GraphQLContext>;
  executeOperation: <TData = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
    headers?: Record<string, string>
  ) => Promise<{
    body: {
      kind: 'single';
      singleResult: {
        data?: TData;
        errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
      };
    };
  }>;
  cleanup: () => Promise<void>;
}

/**
 * Create a test server instance with real database and Redis connections
 */
export async function createTestServer(): Promise<TestServer> {
  // Configure DI container
  configureDI();

  // Get services
  const database = container.resolve<DatabaseService>(DATABASE_SERVICE_TOKEN);
  const redis = container.resolve<RedisService>(REDIS_SERVICE_TOKEN);

  // Connect to database and Redis
  await database.connect();
  await redis.connect();

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
  });

  await server.start();

  /**
   * Execute a GraphQL operation with optional auth
   */
  async function executeOperation<TData = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<{
    body: {
      kind: 'single';
      singleResult: {
        data?: TData;
        errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
      };
    };
  }> {
    // Build context from headers
    let context: GraphQLContext = { user: null };

    const authHeader = headers?.['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const tokenService = container.resolve<ITokenService>(TOKEN_SERVICE_TOKEN);
        const payload = tokenService.verifyAccessToken(token);
        context = { user: payload };
      } catch {
        // Invalid token - continue without auth
      }
    }

    const response = await server.executeOperation(
      {
        query,
        variables,
      },
      {
        contextValue: context,
      }
    );

    return response as {
      body: {
        kind: 'single';
        singleResult: {
          data?: TData;
          errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
        };
      };
    };
  }

  /**
   * Cleanup server and connections
   */
  async function cleanup(): Promise<void> {
    await server.stop();
    await database.disconnect();
    await redis.disconnect();
    // Clear DI container for next test
    container.clearInstances();
  }

  return {
    server,
    executeOperation,
    cleanup,
  };
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestData(): Promise<void> {
  const database = container.resolve<DatabaseService>(DATABASE_SERVICE_TOKEN);
  const client = database.getClient();

  // Delete all users (cascade will handle related data)
  await client.user.deleteMany({});
}

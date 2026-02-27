import { GraphQLError } from 'graphql';

import type { GraphQLContext, AuthenticatedContext } from './context.js';

/**
 * Require authentication for a resolver
 * Throws GraphQL error if user is not authenticated
 */
export function requireAuth(context: GraphQLContext): asserts context is AuthenticatedContext {
  if (context.user === null) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
}

import type { TokenPayload } from '@domain/auth/ports/token-service.port.js';

/**
 * GraphQL Context type
 */
export interface GraphQLContext {
  user: TokenPayload | null;
}

/**
 * Authenticated context (user is guaranteed to exist)
 */
export interface AuthenticatedContext extends GraphQLContext {
  user: TokenPayload;
}

/**
 * Check if context has authenticated user
 */
export function isAuthenticated(context: GraphQLContext): context is AuthenticatedContext {
  return context.user !== null;
}

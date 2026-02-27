import { DateTimeResolver } from 'graphql-scalars';

/**
 * GraphQL Type Definitions for Auth Module
 */
export const authTypeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    email: String!
    name: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
  }

  type AuthPayload {
    user: User!
    tokens: AuthTokens!
  }

  type RefreshPayload {
    tokens: AuthTokens!
  }

  type LogoutPayload {
    success: Boolean!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  input LogoutInput {
    refreshToken: String!
    logoutAll: Boolean
  }

  type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): RefreshPayload!
    logout(input: LogoutInput!): LogoutPayload!
  }
`;

/**
 * Custom scalar resolvers
 */
export const scalarResolvers = {
  DateTime: DateTimeResolver,
};

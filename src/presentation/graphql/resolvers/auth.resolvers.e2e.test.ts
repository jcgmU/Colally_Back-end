import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import {
  createTestServer,
  cleanupTestData,
  type TestServer,
  REGISTER_MUTATION,
  LOGIN_MUTATION,
  ME_QUERY,
  REFRESH_TOKEN_MUTATION,
  LOGOUT_MUTATION,
  type RegisterResponse,
  type LoginResponse,
  type MeResponse,
  type RefreshTokenResponse,
  type LogoutResponse,
} from '@shared/test/e2e/index.js';

describe('Auth E2E Tests', () => {
  let testServer: TestServer;

  // Test user data
  const testUser = {
    email: 'e2e-test@example.com',
    password: 'SecurePass123!',
    name: 'E2E Test User',
  };

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await cleanupTestData();
    await testServer.cleanup();
  });

  beforeEach(async () => {
    // Clean up data before each test for isolation
    await cleanupTestData();
  });

  describe('Register Mutation', () => {
    it('should register a new user successfully', async () => {
      // Act
      const response = await testServer.executeOperation<RegisterResponse>(REGISTER_MUTATION, {
        input: testUser,
      });

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.register).toBeDefined();

      const { user, tokens } = response.body.singleResult.data!.register;
      expect(user.email).toBe(testUser.email);
      expect(user.name).toBe(testUser.name);
      expect(user.isActive).toBe(true);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });

    it('should return error when email already exists', async () => {
      // Arrange - first register the user
      await testServer.executeOperation(REGISTER_MUTATION, { input: testUser });

      // Act - try to register again with same email
      const response = await testServer.executeOperation<RegisterResponse>(REGISTER_MUTATION, {
        input: testUser,
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should return error for invalid email format', async () => {
      // Act
      const response = await testServer.executeOperation<RegisterResponse>(REGISTER_MUTATION, {
        input: { ...testUser, email: 'invalid-email' },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
    });

    it('should return error for weak password', async () => {
      // Act
      const response = await testServer.executeOperation<RegisterResponse>(REGISTER_MUTATION, {
        input: { ...testUser, password: 'weak' },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
    });

    it('should return error for empty name', async () => {
      // Act
      const response = await testServer.executeOperation<RegisterResponse>(REGISTER_MUTATION, {
        input: { ...testUser, name: '' },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
    });

    it('should normalize email to lowercase', async () => {
      // Act
      const response = await testServer.executeOperation<RegisterResponse>(REGISTER_MUTATION, {
        input: { ...testUser, email: 'E2E-TEST@EXAMPLE.COM' },
      });

      // Assert
      expect(response.body.singleResult.data?.register.user.email).toBe('e2e-test@example.com');
    });
  });

  describe('Login Mutation', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await testServer.executeOperation(REGISTER_MUTATION, { input: testUser });
    });

    it('should login with valid credentials', async () => {
      // Act
      const response = await testServer.executeOperation<LoginResponse>(LOGIN_MUTATION, {
        input: { email: testUser.email, password: testUser.password },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.login).toBeDefined();

      const { user, tokens } = response.body.singleResult.data!.login;
      expect(user.email).toBe(testUser.email);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });

    it('should return error for wrong password', async () => {
      // Act
      const response = await testServer.executeOperation<LoginResponse>(LOGIN_MUTATION, {
        input: { email: testUser.email, password: 'WrongPass123!' },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return error for non-existent user', async () => {
      // Act
      const response = await testServer.executeOperation<LoginResponse>(LOGIN_MUTATION, {
        input: { email: 'nonexistent@example.com', password: 'SomePass123!' },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should normalize email to lowercase on login', async () => {
      // Act
      const response = await testServer.executeOperation<LoginResponse>(LOGIN_MUTATION, {
        input: { email: 'E2E-TEST@EXAMPLE.COM', password: testUser.password },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.login.user.email).toBe('e2e-test@example.com');
    });
  });

  describe('Me Query', () => {
    it('should return null when not authenticated', async () => {
      // Act
      const response = await testServer.executeOperation<MeResponse>(ME_QUERY);

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.me).toBeNull();
    });

    it('should return user data when authenticated', async () => {
      // Arrange - register and get tokens
      const registerResponse = await testServer.executeOperation<RegisterResponse>(
        REGISTER_MUTATION,
        { input: testUser }
      );
      const accessToken = registerResponse.body.singleResult.data!.register.tokens.accessToken;

      // Act
      const response = await testServer.executeOperation<MeResponse>(ME_QUERY, undefined, {
        authorization: `Bearer ${accessToken}`,
      });

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.me).toBeDefined();
      expect(response.body.singleResult.data?.me?.email).toBe(testUser.email);
    });

    it('should return null for invalid token', async () => {
      // Act
      const response = await testServer.executeOperation<MeResponse>(ME_QUERY, undefined, {
        authorization: 'Bearer invalid-token',
      });

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.me).toBeNull();
    });
  });

  describe('RefreshToken Mutation', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and get tokens
      const registerResponse = await testServer.executeOperation<RegisterResponse>(
        REGISTER_MUTATION,
        { input: testUser }
      );
      refreshToken = registerResponse.body.singleResult.data!.register.tokens.refreshToken;
    });

    it('should return new tokens with valid refresh token', async () => {
      // Act
      const response = await testServer.executeOperation<RefreshTokenResponse>(
        REFRESH_TOKEN_MUTATION,
        { input: { refreshToken } }
      );

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.refreshToken.tokens).toBeDefined();
      expect(response.body.singleResult.data?.refreshToken.tokens.accessToken).toBeDefined();
      expect(response.body.singleResult.data?.refreshToken.tokens.refreshToken).toBeDefined();
      // New refresh token should be different (rotation)
      expect(response.body.singleResult.data?.refreshToken.tokens.refreshToken).not.toBe(
        refreshToken
      );
    });

    it('should return error for invalid refresh token', async () => {
      // Act
      const response = await testServer.executeOperation<RefreshTokenResponse>(
        REFRESH_TOKEN_MUTATION,
        { input: { refreshToken: 'invalid-token' } }
      );

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVALID_TOKEN');
    });

    it('should return error when using same refresh token twice (rotation)', async () => {
      // Act - first refresh
      await testServer.executeOperation<RefreshTokenResponse>(REFRESH_TOKEN_MUTATION, {
        input: { refreshToken },
      });

      // Act - try to use same token again
      const response = await testServer.executeOperation<RefreshTokenResponse>(
        REFRESH_TOKEN_MUTATION,
        { input: { refreshToken } }
      );

      // Assert - token should be revoked after first use
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Logout Mutation', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Register and get tokens
      const registerResponse = await testServer.executeOperation<RegisterResponse>(
        REGISTER_MUTATION,
        { input: testUser }
      );
      accessToken = registerResponse.body.singleResult.data!.register.tokens.accessToken;
      refreshToken = registerResponse.body.singleResult.data!.register.tokens.refreshToken;
    });

    it('should logout successfully with valid token', async () => {
      // Act
      const response = await testServer.executeOperation<LogoutResponse>(
        LOGOUT_MUTATION,
        { input: { refreshToken } },
        { authorization: `Bearer ${accessToken}` }
      );

      // Assert
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.logout.success).toBe(true);
    });

    it('should invalidate refresh token after logout', async () => {
      // Act - logout
      await testServer.executeOperation<LogoutResponse>(
        LOGOUT_MUTATION,
        { input: { refreshToken } },
        { authorization: `Bearer ${accessToken}` }
      );

      // Try to use refresh token
      const response = await testServer.executeOperation<RefreshTokenResponse>(
        REFRESH_TOKEN_MUTATION,
        { input: { refreshToken } }
      );

      // Assert - token should be revoked
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVALID_TOKEN');
    });

    it('should require authentication for logout', async () => {
      // Act - try to logout without auth
      const response = await testServer.executeOperation<LogoutResponse>(LOGOUT_MUTATION, {
        input: { refreshToken },
      });

      // Assert
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('should logout from all devices when logoutAll is true', async () => {
      // Arrange - login again to get a second refresh token
      const loginResponse = await testServer.executeOperation<LoginResponse>(LOGIN_MUTATION, {
        input: { email: testUser.email, password: testUser.password },
      });
      const secondRefreshToken = loginResponse.body.singleResult.data!.login.tokens.refreshToken;

      // Act - logout all
      await testServer.executeOperation<LogoutResponse>(
        LOGOUT_MUTATION,
        { input: { refreshToken, logoutAll: true } },
        { authorization: `Bearer ${accessToken}` }
      );

      // Try to use second refresh token
      const response = await testServer.executeOperation<RefreshTokenResponse>(
        REFRESH_TOKEN_MUTATION,
        { input: { refreshToken: secondRefreshToken } }
      );

      // Assert - all tokens should be revoked
      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors?.[0]?.extensions?.code).toBe('INVALID_TOKEN');
    });
  });
});

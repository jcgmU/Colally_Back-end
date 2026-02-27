/**
 * GraphQL operations for E2E tests
 */

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        name
        isActive
        createdAt
        updatedAt
      }
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        name
        isActive
        createdAt
        updatedAt
      }
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      tokens {
        accessToken
        refreshToken
      }
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout($input: LogoutInput!) {
    logout(input: $input) {
      success
    }
  }
`;

/**
 * Type definitions for GraphQL responses
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayloadResponse {
  user: UserResponse;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterResponse {
  register: AuthPayloadResponse;
}

export interface LoginResponse {
  login: AuthPayloadResponse;
}

export interface MeResponse {
  me: UserResponse | null;
}

export interface RefreshTokenResponse {
  refreshToken: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface LogoutResponse {
  logout: {
    success: boolean;
  };
}

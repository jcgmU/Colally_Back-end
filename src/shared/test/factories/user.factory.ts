/**
 * User factory for creating test fixtures
 */
import { User, type UserProps } from '@domain/auth/entities/user.js';
import { Email, HashedPassword, UserId } from '@domain/auth/value-objects/index.js';

export interface CreateTestUserOptions {
  id?: string;
  email?: string;
  password?: string;
  name?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

/**
 * Create a test User entity with optional overrides
 */
export function createTestUser(options: CreateTestUserOptions = {}): User {
  const now = new Date();

  const props: UserProps = {
    id: UserId.create(options.id ?? '550e8400-e29b-41d4-a716-446655440000'),
    email: Email.create(options.email ?? 'test@example.com'),
    password: HashedPassword.fromHash(
      options.password ?? '$2b$12$hashedpasswordvalue123456789012345678901234567890'
    ),
    name: options.name ?? 'Test User',
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    passwordResetToken: options.passwordResetToken,
    passwordResetExpires: options.passwordResetExpires,
  };

  return User.reconstitute(props);
}

/**
 * Create a test User with random values (useful for multiple users in a test)
 */
export function createRandomTestUser(overrides: Partial<CreateTestUserOptions> = {}): User {
  const randomId = crypto.randomUUID();
  const randomEmail = `user-${randomId.slice(0, 8)}@example.com`;
  const randomName = `User ${randomId.slice(0, 8)}`;

  return createTestUser({
    id: randomId,
    email: randomEmail,
    name: randomName,
    ...overrides,
  });
}

/**
 * Create an inactive test User
 */
export function createInactiveTestUser(overrides: Partial<CreateTestUserOptions> = {}): User {
  return createTestUser({
    ...overrides,
    isActive: false,
  });
}

/**
 * Valid test password that passes all validation rules
 */
export const VALID_TEST_PASSWORD = 'SecurePass123!';

/**
 * Invalid test passwords for negative testing
 */
export const INVALID_TEST_PASSWORDS = {
  tooShort: 'Abc1!',
  noUppercase: 'password123!',
  noLowercase: 'PASSWORD123!',
  noNumber: 'SecurePassword!',
  noSpecial: 'SecurePass123',
};

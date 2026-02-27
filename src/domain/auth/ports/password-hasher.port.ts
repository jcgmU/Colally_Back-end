import { HashedPassword, Password } from '../value-objects/index.js';

/**
 * Password Hasher Port
 * Defines the interface for password hashing operations
 */
export interface IPasswordHasher {
  /**
   * Hash a plain password
   */
  hash(password: Password): Promise<HashedPassword>;

  /**
   * Verify a plain password against a hashed password
   */
  verify(password: Password, hashedPassword: HashedPassword): Promise<boolean>;
}

export const PASSWORD_HASHER_TOKEN = Symbol('IPasswordHasher');

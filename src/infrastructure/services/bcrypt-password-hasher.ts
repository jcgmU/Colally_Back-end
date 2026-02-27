import bcrypt from 'bcrypt';
import { injectable } from 'tsyringe';

import { getEnv } from '@config/env.js';
import type { IPasswordHasher } from '@domain/auth/ports/password-hasher.port.js';
import { HashedPassword, Password } from '@domain/auth/value-objects/index.js';

/**
 * Bcrypt Password Hasher Implementation
 */
@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  public async hash(password: Password): Promise<HashedPassword> {
    const env = getEnv();
    const hash = await bcrypt.hash(password.value, env.BCRYPT_ROUNDS);
    return HashedPassword.fromHash(hash);
  }

  public async verify(password: Password, hashedPassword: HashedPassword): Promise<boolean> {
    return bcrypt.compare(password.value, hashedPassword.value);
  }
}

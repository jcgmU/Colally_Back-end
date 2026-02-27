import { DomainError } from '@shared/errors/domain-error.js';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`, 'INVALID_EMAIL');
  }
}

export class InvalidPasswordError extends DomainError {
  constructor(reason: string) {
    super(`Invalid password: ${reason}`, 'INVALID_PASSWORD');
  }
}

export class WeakPasswordError extends DomainError {
  constructor() {
    super(
      'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
      'WEAK_PASSWORD'
    );
  }
}

export class InvalidUserIdError extends DomainError {
  constructor(id: string) {
    super(`Invalid user ID format: ${id}`, 'INVALID_USER_ID');
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'USER_ALREADY_EXISTS');
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

export class UserInactiveError extends DomainError {
  constructor() {
    super('User account is inactive', 'USER_INACTIVE');
  }
}

export class InvalidTokenError extends DomainError {
  constructor(reason: string = 'Token is invalid or expired') {
    super(reason, 'INVALID_TOKEN');
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
  }
}

export class InvalidResetTokenError extends DomainError {
  constructor() {
    super('Password reset token is invalid or expired', 'INVALID_RESET_TOKEN');
  }
}

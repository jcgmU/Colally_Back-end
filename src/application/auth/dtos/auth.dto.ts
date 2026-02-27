import { z } from 'zod';

// ============================================
// Input DTOs (with Zod validation)
// ============================================

export const RegisterUserInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
});

export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;

export const LoginUserInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginUserInput = z.infer<typeof LoginUserInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;

export const LogoutInputSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  logoutAll: z.boolean().optional().default(false),
});

export type LogoutInput = z.infer<typeof LogoutInputSchema>;

// ============================================
// Output DTOs
// ============================================

export interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
}

export interface UserOutput {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserOutput {
  user: UserOutput;
  tokens: AuthTokensOutput;
}

export interface LoginUserOutput {
  user: UserOutput;
  tokens: AuthTokensOutput;
}

export interface RefreshTokenOutput {
  tokens: AuthTokensOutput;
}

export interface LogoutOutput {
  success: boolean;
}

export interface GetCurrentUserOutput {
  user: UserOutput;
}

import { z } from 'zod';

/**
 * Environment configuration schema with Zod validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Password hashing
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`);
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return result.data;
}

/**
 * Singleton environment configuration
 */
let envCache: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  envCache ??= loadEnv();
  return envCache;
}

/**
 * Parse TTL string to seconds
 * Supports: 15m, 1h, 7d, 30s
 */
export function parseTtlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}. Expected format: 15m, 1h, 7d, 30s`);
  }

  const value = parseInt(match[1] ?? '0', 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

export { envSchema };

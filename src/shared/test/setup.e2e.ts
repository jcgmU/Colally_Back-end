// Test setup for E2E tests
import 'reflect-metadata';
import { vi } from 'vitest';

// Mock environment variables for E2E tests
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4001'); // Different port for tests
vi.stubEnv('DATABASE_URL', 'postgresql://colally:colally_secret@localhost:5432/colally?schema=public');
vi.stubEnv('REDIS_URL', 'redis://:colally_redis_secret@localhost:6379');
vi.stubEnv('JWT_SECRET', 'test-secret-key-at-least-32-characters-long');
vi.stubEnv('JWT_ACCESS_TOKEN_TTL', '15m');
vi.stubEnv('JWT_REFRESH_TOKEN_TTL', '7d');
vi.stubEnv('BCRYPT_ROUNDS', '4'); // Lower for faster tests
vi.stubEnv('CORS_ORIGIN', 'http://localhost:3000');
vi.stubEnv('RATE_LIMIT_WINDOW_MS', '900000');
vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '100');

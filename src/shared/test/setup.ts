// Test setup for unit/integration tests
import 'reflect-metadata';
import { vi } from 'vitest';

// Mock environment variables for tests
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
vi.stubEnv('REDIS_URL', 'redis://localhost:6379');
vi.stubEnv('JWT_SECRET', 'test-secret-key-at-least-32-characters-long');
vi.stubEnv('JWT_ACCESS_TOKEN_TTL', '15m');
vi.stubEnv('JWT_REFRESH_TOKEN_TTL', '7d');
vi.stubEnv('BCRYPT_ROUNDS', '4'); // Lower for faster tests
vi.stubEnv('CORS_ORIGIN', 'http://localhost:3000');
vi.stubEnv('RATE_LIMIT_WINDOW_MS', '900000');
vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '100');

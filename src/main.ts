import 'reflect-metadata';

import { configureDI, createApolloServer, getEnv, container } from '@config/index.js';
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';
import { RedisService, REDIS_SERVICE_TOKEN } from '@infrastructure/redis/index.js';

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    // Load and validate environment
    const env = getEnv();

    // Configure dependency injection
    configureDI();

    // Get infrastructure services
    const database = container.resolve<DatabaseService>(DATABASE_SERVICE_TOKEN);
    const redis = container.resolve<RedisService>(REDIS_SERVICE_TOKEN);

    // Connect to databases
    console.warn('Connecting to PostgreSQL...');
    await database.connect();
    console.warn('PostgreSQL connected');

    console.warn('Connecting to Redis...');
    await redis.connect();
    console.warn('Redis connected');

    // Create and start server
    const { url } = await createApolloServer();

    console.warn(`🚀 ColAlly Backend running at ${url}`);
    console.warn(`🔧 Environment: ${env.NODE_ENV}`);

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.warn(`\n${signal} received. Shutting down gracefully...`);

      await redis.disconnect();
      console.warn('Redis disconnected');

      await database.disconnect();
      console.warn('PostgreSQL disconnected');

      process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void main();

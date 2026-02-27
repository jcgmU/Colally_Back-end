import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

import { getEnv } from '@config/env.js';

/**
 * Database Service - Prisma Client wrapper
 */
@injectable()
export class DatabaseService {
  private client: PrismaClient | null = null;

  public getClient(): PrismaClient {
    if (this.client === null) {
      const env = getEnv();

      this.client = new PrismaClient({
        datasourceUrl: env.DATABASE_URL,
        log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }

    return this.client;
  }

  public async connect(): Promise<void> {
    await this.getClient().$connect();
  }

  public async disconnect(): Promise<void> {
    if (this.client !== null) {
      await this.client.$disconnect();
      this.client = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.getClient().$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

export const DATABASE_SERVICE_TOKEN = Symbol('DatabaseService');

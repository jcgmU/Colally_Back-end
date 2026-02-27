/**
 * Project factory for creating test fixtures
 */
import { Project } from '@domain/project/entities/index.js';
import {
  ProjectId,
  ProjectName,
  ProjectStatus,
} from '@domain/project/value-objects/index.js';
import { TeamId } from '@domain/team/value-objects/index.js';
import { UserId } from '@domain/auth/value-objects/index.js';

// ============================================
// Project Factory
// ============================================

export interface CreateTestProjectOptions {
  id?: string;
  teamId?: string;
  name?: string;
  description?: string | null;
  status?: 'active' | 'archived';
  position?: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a test Project entity with optional overrides
 */
export function createTestProject(options: CreateTestProjectOptions = {}): Project {
  const now = new Date();

  return Project.reconstitute({
    id: ProjectId.create(options.id ?? '550e8400-e29b-41d4-a716-446655440001'),
    teamId: TeamId.create(options.teamId ?? '660e8400-e29b-41d4-a716-446655440001'),
    name: ProjectName.create(options.name ?? 'Test Project'),
    description: options.description ?? null,
    status: ProjectStatus.create(options.status ?? 'active'),
    position: options.position ?? 0,
    createdBy: UserId.create(options.createdBy ?? '770e8400-e29b-41d4-a716-446655440001'),
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  });
}

/**
 * Create a test Project with random values
 */
export function createRandomTestProject(overrides: Partial<CreateTestProjectOptions> = {}): Project {
  const randomId = crypto.randomUUID();
  const randomName = `Project ${randomId.slice(0, 8)}`;

  return createTestProject({
    id: randomId,
    name: randomName,
    ...overrides,
  });
}

/**
 * Create an archived test project
 */
export function createArchivedTestProject(overrides: Partial<CreateTestProjectOptions> = {}): Project {
  return createTestProject({
    status: 'archived',
    ...overrides,
  });
}

// ============================================
// Test IDs for Projects
// ============================================

export const PROJECT_TEST_IDS = {
  project1: '550e8400-e29b-41d4-a716-446655440001',
  project2: '550e8400-e29b-41d4-a716-446655440002',
  project3: '550e8400-e29b-41d4-a716-446655440003',
};

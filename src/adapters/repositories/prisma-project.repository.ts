import type { Project as PrismaProject } from '@prisma/client';
import { inject, injectable } from 'tsyringe';

import { UserId } from '@domain/auth/value-objects/index.js';
import { Project } from '@domain/project/entities/index.js';
import type { IProjectRepository } from '@domain/project/ports/index.js';
import {
  ProjectId,
  ProjectName,
  ProjectStatus,
} from '@domain/project/value-objects/index.js';
import { TeamId } from '@domain/team/value-objects/index.js';
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';

/**
 * Prisma Project Repository Implementation
 */
@injectable()
export class PrismaProjectRepository implements IProjectRepository {
  constructor(
    @inject(DATABASE_SERVICE_TOKEN)
    private readonly database: DatabaseService
  ) {}

  // ============================================
  // Project CRUD
  // ============================================

  public async save(project: Project): Promise<void> {
    await this.database.getClient().project.upsert({
      where: { id: project.id.value },
      update: {
        name: project.name.value,
        description: project.description,
        status: project.status.value,
        position: project.position,
        updatedAt: project.updatedAt,
      },
      create: {
        id: project.id.value,
        teamId: project.teamId.value,
        name: project.name.value,
        description: project.description,
        status: project.status.value,
        position: project.position,
        createdBy: project.createdBy.value,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  }

  public async findById(id: ProjectId): Promise<Project | null> {
    const prismaProject = await this.database.getClient().project.findUnique({
      where: { id: id.value },
    });

    if (prismaProject === null) {
      return null;
    }

    return this.toDomain(prismaProject);
  }

  public async findByTeamId(
    teamId: TeamId,
    includeArchived: boolean = false
  ): Promise<Project[]> {
    const whereClause: { teamId: string; status?: string } = {
      teamId: teamId.value,
    };

    if (!includeArchived) {
      whereClause.status = ProjectStatus.ACTIVE;
    }

    const prismaProjects = await this.database.getClient().project.findMany({
      where: whereClause,
      orderBy: { position: 'asc' },
    });

    return prismaProjects.map((p) => this.toDomain(p));
  }

  public async delete(id: ProjectId): Promise<void> {
    await this.database.getClient().project.delete({
      where: { id: id.value },
    });
  }

  // ============================================
  // Position Management
  // ============================================

  public async getNextPosition(teamId: TeamId): Promise<number> {
    const result = await this.database.getClient().project.aggregate({
      where: { teamId: teamId.value },
      _max: { position: true },
    });

    const maxPosition = result._max.position;
    return maxPosition !== null ? maxPosition + 1 : 0;
  }

  public async updatePositions(
    projects: Array<{ id: ProjectId; position: number }>
  ): Promise<void> {
    await this.database.getClient().$transaction(
      projects.map(({ id, position }) =>
        this.database.getClient().project.update({
          where: { id: id.value },
          data: { position, updatedAt: new Date() },
        })
      )
    );
  }

  // ============================================
  // Private Mappers
  // ============================================

  private toDomain(prismaProject: PrismaProject): Project {
    return Project.reconstitute({
      id: ProjectId.create(prismaProject.id),
      teamId: TeamId.create(prismaProject.teamId),
      name: ProjectName.create(prismaProject.name),
      description: prismaProject.description,
      status: ProjectStatus.create(prismaProject.status),
      position: prismaProject.position,
      createdBy: UserId.create(prismaProject.createdBy),
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
    });
  }
}

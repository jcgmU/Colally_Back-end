import type { User as PrismaUser } from '@prisma/client';
import { inject, injectable } from 'tsyringe';

import { User } from '@domain/auth/entities/index.js';
import type { IUserRepository, UpdateProfileData } from '@domain/auth/ports/user-repository.port.js';
import { Email, HashedPassword, UserId } from '@domain/auth/value-objects/index.js';
import { AvatarUrl } from '@domain/team/value-objects/index.js';
import { DatabaseService, DATABASE_SERVICE_TOKEN } from '@infrastructure/database/index.js';

/**
 * Prisma User Repository Implementation
 */
@injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @inject(DATABASE_SERVICE_TOKEN)
    private readonly database: DatabaseService
  ) {}

  public async findById(id: UserId): Promise<User | null> {
    const prismaUser = await this.database.getClient().user.findUnique({
      where: { id: id.value },
    });

    if (prismaUser === null) {
      return null;
    }

    return this.toDomainEntity(prismaUser);
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const prismaUser = await this.database.getClient().user.findUnique({
      where: { email: email.value },
    });

    if (prismaUser === null) {
      return null;
    }

    return this.toDomainEntity(prismaUser);
  }

  public async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.database.getClient().user.count({
      where: { email: email.value },
    });

    return count > 0;
  }

  public async save(user: User): Promise<void> {
    const data = user.toPersistence();

    await this.database.getClient().user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        password: data.password,
        name: data.name,
        avatarUrl: data.avatarUrl,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
        passwordResetToken: data.passwordResetToken,
        passwordResetExpires: data.passwordResetExpires,
      },
    });
  }

  public async updateProfile(id: UserId, data: UpdateProfileData): Promise<User> {
    const updateData: { name?: string; avatarUrl?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl?.value ?? null;
    }

    const prismaUser = await this.database.getClient().user.update({
      where: { id: id.value },
      data: updateData,
    });

    return this.toDomainEntity(prismaUser);
  }

  public async delete(id: UserId): Promise<void> {
    await this.database.getClient().user.delete({
      where: { id: id.value },
    });
  }

  public async findByPasswordResetToken(token: string): Promise<User | null> {
    const prismaUser = await this.database.getClient().user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (prismaUser === null) {
      return null;
    }

    return this.toDomainEntity(prismaUser);
  }

  private toDomainEntity(prismaUser: PrismaUser): User {
    return User.reconstitute({
      id: UserId.create(prismaUser.id),
      email: Email.create(prismaUser.email),
      password: HashedPassword.fromHash(prismaUser.password),
      name: prismaUser.name,
      avatarUrl: AvatarUrl.create(prismaUser.avatarUrl),
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      passwordResetToken: prismaUser.passwordResetToken ?? undefined,
      passwordResetExpires: prismaUser.passwordResetExpires ?? undefined,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  CreateRoleInput,
  RoleRepositoryPort,
  RoleSummary,
  RoleWithPermissions,
} from '../../../domain/ports/role.repository.port';

@Injectable()
export class RolePrismaRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleSummary[]> {
    const roles = await this.prisma.role.findMany();
    return roles.map((r) => ({ id: r.id, roleName: r.roleName, description: r.description }));
  }

  async findById(id: string): Promise<RoleWithPermissions | null> {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { permissions: true } });
    if (!role) return null;
    return {
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      permissions: role.permissions.map((p) => ({
        entityDomain: p.entityDomain,
        accessLevel: p.accessLevel,
      })),
    };
  }

  async create(input: CreateRoleInput): Promise<RoleSummary> {
    const role = await this.prisma.role.create({
      data: { roleName: input.roleName, description: input.description ?? null },
    });
    return { id: role.id, roleName: role.roleName, description: role.description };
  }

  async getPermission(roleId: string, entityDomain: EntityDomain): Promise<AccessLevel> {
    const row = await this.prisma.rolePermission.findUnique({
      where: { roleId_entityDomain: { roleId, entityDomain } },
    });
    return row?.accessLevel ?? 'NoAccess';
  }

  async setPermission(roleId: string, entityDomain: EntityDomain, accessLevel: AccessLevel): Promise<void> {
    await this.prisma.rolePermission.upsert({
      where: { roleId_entityDomain: { roleId, entityDomain } },
      create: { roleId, entityDomain, accessLevel },
      update: { accessLevel },
    });
  }
}

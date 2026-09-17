import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateUserInput,
  UpdateUserInput,
  UserRepositoryPort,
  UserWithRole,
} from '../../../domain/ports/user.repository.port';

const USER_WITH_ROLE_INCLUDE = { role: { include: { permissions: true } } } as const;

type PrismaUserWithRole = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  status: string;
  roleId: string;
  role: { roleName: string; permissions: { entityDomain: string; accessLevel: string }[] };
};

function toUserWithRole(user: PrismaUserWithRole): UserWithRole {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    passwordHash: user.passwordHash,
    status: user.status,
    roleId: user.roleId,
    roleName: user.role.roleName,
    permissions: user.role.permissions.map((p) => ({
      entityDomain: p.entityDomain,
      accessLevel: p.accessLevel,
    })),
  };
}

@Injectable()
export class UserPrismaRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithRole | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: USER_WITH_ROLE_INCLUDE,
    });
    if (!user) return null;
    return toUserWithRole(user);
  }

  async recordLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLogin: new Date() } });
  }

  async findAll(): Promise<UserWithRole[]> {
    const users = await this.prisma.user.findMany({ include: USER_WITH_ROLE_INCLUDE });
    return users.map(toUserWithRole);
  }

  async findById(userId: string): Promise<UserWithRole | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_WITH_ROLE_INCLUDE,
    });
    if (!user) return null;
    return toUserWithRole(user);
  }

  async create(input: CreateUserInput): Promise<UserWithRole> {
    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash: input.passwordHash,
        roleId: input.roleId,
        status: input.status,
      },
      include: USER_WITH_ROLE_INCLUDE,
    });
    return toUserWithRole(user);
  }

  async update(userId: string, input: UpdateUserInput): Promise<UserWithRole> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        email: input.email,
        roleId: input.roleId,
        status: input.status,
      },
      include: USER_WITH_ROLE_INCLUDE,
    });
    return toUserWithRole(user);
  }
}

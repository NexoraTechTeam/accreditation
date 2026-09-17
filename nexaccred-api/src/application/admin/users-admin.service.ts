import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  UpdateUserInput,
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
  UserWithRole,
} from '../../domain/ports/user.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';
import { PasswordHasher } from '../../infrastructure/auth/password-hasher';

/** Public, API-facing shape of a User — `passwordHash` is never included, here or in the audit trail. */
export interface UserAdminView {
  id: string;
  fullName: string;
  email: string;
  status: string;
  roleId: string;
  roleName: string;
  permissions: UserWithRole['permissions'];
}

export interface CreateUserAdminInput {
  fullName: string;
  email: string;
  password: string; // plaintext — hashed inside this service, never persisted or logged raw
  roleId: string;
  status?: string;
}

function toAdminView(user: UserWithRole): UserAdminView {
  // Deliberately explicit field-by-field mapping (not a spread + delete) so a
  // future field added to UserWithRole can never leak into an API response
  // or an audit-trail record by accident.
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    status: user.status,
    roleId: user.roleId,
    roleName: user.roleName,
    permissions: user.permissions,
  };
}

/**
 * Application-layer use-cases for User CRUD (Administration domain, RBAC
 * §3.1 "who can log into the system?" is the System Administrator's call).
 * No `delete` — a user is deactivated via `status`, matching the existing
 * User.status field and AuthService's login check (`user.status !== 'Active'`).
 */
@Injectable()
export class UsersAdminService {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly users: UserRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async list(): Promise<UserAdminView[]> {
    const users = await this.users.findAll();
    return users.map(toAdminView);
  }

  async get(id: string): Promise<UserAdminView> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException(`User "${id}" not found`);
    }
    return toAdminView(user);
  }

  async create(input: CreateUserAdminInput, actingUserId: string): Promise<UserAdminView> {
    const passwordHash = await this.passwordHasher.hash(input.password);
    const created = await this.users.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      roleId: input.roleId,
      status: input.status,
    });
    const view = toAdminView(created);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'create',
      entityType: 'User',
      entityId: created.id,
      beforeAfter: { before: null, after: view },
    });
    return view;
  }

  async update(id: string, input: UpdateUserInput, actingUserId: string): Promise<UserAdminView> {
    const before = await this.get(id); // 404s here if the user doesn't exist
    const after = toAdminView(await this.users.update(id, input));
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'update',
      entityType: 'User',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }
}

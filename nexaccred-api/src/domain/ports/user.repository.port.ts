export interface UserPermission {
  entityDomain: string; // matches Prisma's EntityDomain enum values
  accessLevel: string; // matches Prisma's AccessLevel enum values
}

export interface UserWithRole {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  status: string;
  roleId: string;
  roleName: string;
  permissions: UserPermission[];
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  status?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  roleId?: string;
  status?: string;
}

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

/**
 * Local identity — NexAccred's own User/Role/RolePermission tables (Data
 * Model §1.3, RBAC §1). Nothing to do with AIHCM: AIHCM's employees are a
 * separate HR concept (personnelRef), not NexAccred logins. A person could
 * plausibly have both, unrelated in this schema.
 *
 * findAll/findById/create/update were added for the Administration bounded
 * context (User CRUD, RBAC §3.1 "who can log into the system?" is the
 * System Administrator's call). They were added HERE rather than as a
 * separate admin-user.repository.port.ts because this port already owns
 * "everything about reading/writing the User table" — findByEmail and
 * recordLogin are just the two methods AuthService happens to need, not a
 * conceptually distinct port. A second port over the same table would only
 * invite the two to drift. AuthService's existing calls (findByEmail,
 * recordLogin) are unchanged in signature and behavior.
 */
export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserWithRole | null>;
  recordLogin(userId: string): Promise<void>;
  findAll(): Promise<UserWithRole[]>;
  findById(userId: string): Promise<UserWithRole | null>;
  create(input: CreateUserInput): Promise<UserWithRole>;
  update(userId: string, input: UpdateUserInput): Promise<UserWithRole>;
}

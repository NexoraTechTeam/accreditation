import { AccessLevel, EntityDomain } from '@prisma/client';

export interface RoleSummary {
  id: string;
  roleName: string;
  description: string | null;
}

export interface RolePermissionEntry {
  entityDomain: EntityDomain;
  accessLevel: AccessLevel;
}

export interface RoleWithPermissions extends RoleSummary {
  permissions: RolePermissionEntry[];
}

export interface CreateRoleInput {
  roleName: string;
  description?: string | null;
}

export const ROLE_REPOSITORY_PORT = Symbol('ROLE_REPOSITORY_PORT');

/**
 * Outbound port for Role + RolePermission (RBAC §1: both live under the
 * Administration domain — "Users, Roles, Organization, Workflow,
 * Notifications, Integrations, Audit Trail"). Role update/delete are
 * deliberately out of scope for now (see application/admin/roles-admin.service.ts) —
 * this port only exposes what's needed for list/get/create plus the single
 * permission-grant operation.
 */
export interface RoleRepositoryPort {
  findAll(): Promise<RoleSummary[]>;
  findById(id: string): Promise<RoleWithPermissions | null>;
  create(input: CreateRoleInput): Promise<RoleSummary>;

  /** Current access level a role holds on one domain — NoAccess if no row exists yet. */
  getPermission(roleId: string, entityDomain: EntityDomain): Promise<AccessLevel>;

  /** Upserts the role's access level for one domain (RolePermission's @@unique([roleId, entityDomain])). */
  setPermission(roleId: string, entityDomain: EntityDomain, accessLevel: AccessLevel): Promise<void>;
}

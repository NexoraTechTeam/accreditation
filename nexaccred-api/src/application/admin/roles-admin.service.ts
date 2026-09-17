import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import {
  CreateRoleInput,
  ROLE_REPOSITORY_PORT,
  RoleRepositoryPort,
  RoleSummary,
  RoleWithPermissions,
} from '../../domain/ports/role.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';
import { JwtClaims } from '../auth/jwt-claims';

// Same NoAccess < View < Edit < Approve ordering PermissionsGuard enforces
// (interface/auth/permissions.guard.ts's LEVEL_RANK) — duplicated here
// rather than imported because permissions.guard.ts is a Nest guard in the
// interface layer and this is an application-layer service; the ordering
// itself is fixed by RBAC §1 ("NoAccess < View < Edit < Approve") and is not
// expected to change independently in either place.
const LEVEL_RANK: Record<AccessLevel, number> = {
  NoAccess: 0,
  View: 1,
  Edit: 2,
  Approve: 3,
};

export interface RolePermissionResult {
  roleId: string;
  entityDomain: EntityDomain;
  before: AccessLevel;
  after: AccessLevel;
}

/**
 * Application-layer use-cases for Role + RolePermission (Administration
 * domain). Role update/delete are out of scope for this pass — only
 * list/get/create are implemented; changing a role's name/description or
 * removing a role entirely is left for a later change, since neither was
 * asked for here and delete in particular needs a decision about what
 * happens to users still holding the deleted role.
 */
@Injectable()
export class RolesAdminService {
  constructor(
    @Inject(ROLE_REPOSITORY_PORT) private readonly roles: RoleRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  list(): Promise<RoleSummary[]> {
    return this.roles.findAll();
  }

  async get(id: string): Promise<RoleWithPermissions> {
    const role = await this.roles.findById(id);
    if (!role) {
      throw new NotFoundException(`Role "${id}" not found`);
    }
    return role;
  }

  async create(input: CreateRoleInput, actingUserId: string): Promise<RoleSummary> {
    const created = await this.roles.create(input);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'create',
      entityType: 'Role',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  /**
   * PATCH /roles/:roleId/permissions/:entityDomain — the highest-stakes
   * write in this bounded context.
   *
   * The @Auth(Administration, Approve) guard on the controller already
   * requires the acting user to hold Approve on Administration to call this
   * endpoint at all — that's the normal RBAC gate, identical in shape to
   * every other @Auth() check in the app.
   *
   * What's special here is RBAC §5's separate, additional rule: "A role
   * cannot grant itself a permission it does not hold." We enforce the
   * stronger, safer reading of that sentence: the ACTING USER cannot use
   * this endpoint to grant ANY role a higher access level on a domain than
   * the acting user's own role currently holds on that SAME domain — not
   * just when the target role equals the actor's own role. This is
   * deliberately broader than "can't edit your own role's permissions",
   * because the narrower reading would still let a System Administrator
   * (Administration: Approve, but NoAccess on every business domain per the
   * RBAC §2 matrix) grant some OTHER role Edit or Approve on Requirements,
   * Evidence, Personnel, FindingsCAPA or Reporting — content the
   * Administrator has no competence or standing over. RBAC §3.1 is explicit
   * that this must be impossible: "the System Administrator is not a
   * super-admin" and "if a single role could do both, an administrator
   * could quietly weaken a requirement... That is precisely the
   * impartiality risk accreditation exists to prevent." The only domain a
   * fresh System Administrator can ever grant on is Administration itself,
   * which is exactly the intended boundary.
   *
   * The acting user's own level is read from `request.user.permissions` —
   * i.e. straight off the verified JWT (jwt-claims.ts), never re-fetched
   * from the DB — consistent with how PermissionsGuard itself authorizes
   * every other route in this app.
   */
  async setPermission(
    actingUser: JwtClaims,
    roleId: string,
    entityDomain: EntityDomain,
    accessLevel: AccessLevel,
  ): Promise<RolePermissionResult> {
    const role = await this.roles.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }

    const actingGrant = actingUser.permissions.find((p) => p.entityDomain === entityDomain);
    const actingLevel = (actingGrant?.accessLevel as AccessLevel | undefined) ?? 'NoAccess';

    if (LEVEL_RANK[accessLevel] > LEVEL_RANK[actingLevel]) {
      throw new ForbiddenException(
        `Cannot grant "${accessLevel}" on ${entityDomain}: your own role ("${actingUser.roleName}") only ` +
          `holds "${actingLevel}" on ${entityDomain}. A role cannot grant a permission it does not itself hold ` +
          '(RBAC §5).',
      );
    }

    const before = await this.roles.getPermission(roleId, entityDomain);
    await this.roles.setPermission(roleId, entityDomain, accessLevel);

    // RBAC §5: "Every permission change is written to the immutable audit
    // trail with actor, timestamp, before/after."
    await this.auditTrail.record({
      userId: actingUser.sub,
      action: 'update',
      entityType: 'RolePermission',
      entityId: `${roleId}:${entityDomain}`,
      beforeAfter: { before: { roleId, entityDomain, accessLevel: before }, after: { roleId, entityDomain, accessLevel } },
    });

    return { roleId, entityDomain, before, after: accessLevel };
  }
}

import { SetMetadata } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';

export const PERMISSION_METADATA_KEY = 'requiredPermission';

export interface RequiredPermission {
  domain: EntityDomain;
  minLevel: AccessLevel;
}

/**
 * Declares the entity domain + minimum access level a route needs, straight
 * from RBAC §1's "permissions composed as entity domain × access level,
 * never hard-wired per screen." Read by PermissionsGuard. Example:
 *
 *   @RequirePermission(EntityDomain.FindingsCAPA, AccessLevel.Edit)
 *   @Post('findings')
 *   create(...) { ... }
 */
export const RequirePermission = (domain: EntityDomain, minLevel: AccessLevel) =>
  SetMetadata(PERMISSION_METADATA_KEY, { domain, minLevel } satisfies RequiredPermission);

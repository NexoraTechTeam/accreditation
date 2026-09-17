import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessLevel } from '@prisma/client';
import { PERMISSION_METADATA_KEY, RequiredPermission } from './require-permission.decorator';
import { AuthenticatedRequest } from './jwt-auth.guard';

/** NoAccess < View < Edit < Approve — RBAC §1. */
const LEVEL_RANK: Record<AccessLevel, number> = {
  NoAccess: 0,
  View: 1,
  Edit: 2,
  Approve: 3,
};

/**
 * Enforces @RequirePermission server-side — this is what makes RBAC §5's
 * "every API endpoint validates role_permission server-side" true, closing
 * the prototype gap the frontend README documents as UI-only filtering
 * (nexaccred-react's Sidebar hides nav items, but never enforced anything).
 *
 * Must run after JwtAuthGuard (see each controller's @UseGuards order) so
 * `request.user` is already populated.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true; // no @RequirePermission on this route — authentication alone is enough

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const grant = request.user.permissions.find((p) => p.entityDomain === required.domain);
    const grantedLevel = grant ? LEVEL_RANK[grant.accessLevel as AccessLevel] : LEVEL_RANK.NoAccess;

    if (grantedLevel < LEVEL_RANK[required.minLevel]) {
      throw new ForbiddenException(
        `Role "${request.user.roleName}" has ${grant?.accessLevel ?? 'NoAccess'} on ${required.domain}, ` +
          `but this action requires at least ${required.minLevel}`,
      );
    }
    return true;
  }
}

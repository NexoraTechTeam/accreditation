import { applyDecorators, UseGuards } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './require-permission.decorator';

/**
 * One decorator = "must be logged in AND hold at least this permission."
 * This is the one every controller in this codebase should reach for —
 * bundles JwtAuthGuard + PermissionsGuard + @RequirePermission so the guard
 * pair can never accidentally be applied out of order or forgotten.
 *
 *   @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
 *   @Post('findings')
 *   create(...) { ... }
 */
export const Auth = (domain: EntityDomain, minLevel: AccessLevel) =>
  applyDecorators(UseGuards(JwtAuthGuard, PermissionsGuard), RequirePermission(domain, minLevel));

/** Requires a valid session but no specific domain permission — e.g. Tasks (RBAC §1 note below). */
export const Authenticated = () => applyDecorators(UseGuards(JwtAuthGuard));

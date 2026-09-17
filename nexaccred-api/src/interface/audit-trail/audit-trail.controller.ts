import { Controller, Get, Inject, Query } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';
import { Auth } from '../auth/auth.decorator';

/** RBAC §1: Audit Trail is explicitly under the Administration domain. */
@Controller('audit-trail')
@Auth(EntityDomain.Administration, AccessLevel.View)
export class AuditTrailController {
  constructor(@Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort) {}

  @Get()
  list(@Query('entityType') entityType?: string, @Query('userId') userId?: string) {
    return this.auditTrail.list({ entityType, userId });
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { OperationsService } from '../../application/operations/operations.service';
import { Auth } from '../auth/auth.decorator';

/**
 * Backs the Operation module's Platform Audit-sourced screens (Certification
 * Activities, Audits, Technical Review, Certification Decisions — PRD
 * FR-12.1). Currently served by the stub adapter; see
 * infrastructure/integrations/platform-audit/platform-audit-stub.gateway.ts.
 *
 * RBAC domain mapping note: 05-RBAC-Separation-of-Duties.md's domain table
 * does not name these four screens explicitly (only "Personnel" is called
 * out from the Operation nav group). Treated as Requirements domain here —
 * the closest existing bucket, since they sit alongside Schemes/Compliance
 * as operational visibility the same roles (Head, Staff, Certification
 * Manager) need. Flagged as a judgment call, not a documented decision.
 */
@Controller('operations')
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('certification-activities')
  certificationActivities() {
    return this.operations.getCertificationActivityWorkload();
  }

  @Get('audits')
  audits(@Query('schemeRef') schemeRef?: string) {
    return this.operations.getAuditExecutionRecords(schemeRef);
  }

  @Get('technical-review')
  technicalReview() {
    return this.operations.getTechnicalReviewQueue();
  }

  @Get('certification-decisions')
  certificationDecisions(@Query('schemeRef') schemeRef?: string) {
    return this.operations.getCertificationDecisions(schemeRef);
  }
}

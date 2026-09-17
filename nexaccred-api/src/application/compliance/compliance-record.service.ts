import { Inject, Injectable } from '@nestjs/common';
import {
  COMPLIANCE_RECORD_REPOSITORY_PORT,
  ComplianceRecordRepositoryPort,
  ComplianceRecordSummary,
  CreateComplianceRecordInput,
} from '../../domain/ports/compliance-record.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the ComplianceRecord bounded context.
 * List + create only — see domain/ports/compliance-record.repository.port.ts
 * for why there is no update/delete: a compliance status change is always a
 * new record, matching the "readiness is never stored, always derived"
 * philosophy in domain/readiness/readiness-engine.ts.
 */
@Injectable()
export class ComplianceRecordService {
  constructor(
    @Inject(COMPLIANCE_RECORD_REPOSITORY_PORT)
    private readonly complianceRecords: ComplianceRecordRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listComplianceRecords(filter?: {
    schemeId?: string;
    requirementId?: string;
  }): Promise<ComplianceRecordSummary[]> {
    return this.complianceRecords.findAll(filter);
  }

  async createComplianceRecord(
    input: CreateComplianceRecordInput,
    userId: string,
  ): Promise<ComplianceRecordSummary> {
    const created = await this.complianceRecords.create(input);
    await this.auditTrail.record({
      userId,
      action: 'create',
      entityType: 'ComplianceRecord',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  AuditExecutionRecord,
  CertificationDecisionRecord,
  OperationsPort,
  TechnicalReviewItem,
  WorkloadAggregate,
} from '../../../domain/ports/operations.port';
import {
  EXTERNAL_SYNC_LOG_REPOSITORY_PORT,
  ExternalSyncLogRepositoryPort,
} from '../../../domain/ports/external-sync-log.repository.port';

/**
 * STUB — Platform Audit has no live application yet (only a planning
 * document exists as of this writing: "01 - Platform Audit/Revampt
 * AuditQ.docx"). This adapter returns realistic sample data so the rest of
 * the system — controllers, dashboards, the readiness engine's Operations
 * pillar — can be built and tested against the OperationsPort contract now.
 *
 * To swap this for a real integration once Platform Audit ships an API:
 * write a `PlatformAuditHttpGateway implements OperationsPort` (mirror
 * infrastructure/integrations/aihcm/aihcm-http.gateway.ts's shape) and swap
 * the DI binding in infrastructure/integrations/integrations.module.ts.
 * Nothing outside that one module needs to change — this is the entire
 * point of depending on OperationsPort rather than a concrete class.
 */
@Injectable()
export class PlatformAuditStubGateway implements OperationsPort {
  constructor(
    @Inject(EXTERNAL_SYNC_LOG_REPOSITORY_PORT) private readonly syncLog: ExternalSyncLogRepositoryPort,
  ) {}

  async getCertificationActivityWorkload(): Promise<WorkloadAggregate[]> {
    const data: WorkloadAggregate[] = [
      { schemeRef: 'iso27001', schemeName: 'ISO 27001', inReviewCount: 214, totalCount: 746 },
      { schemeRef: 'iso27701', schemeName: 'ISO 27701', inReviewCount: 58, totalCount: 210 },
      { schemeRef: 'iso9001', schemeName: 'ISO 9001', inReviewCount: 132, totalCount: 480 },
    ];
    await this.recordStubSync('Lifecycle', data.length);
    return data;
  }

  async getAuditExecutionRecords(schemeRef?: string): Promise<AuditExecutionRecord[]> {
    const data: AuditExecutionRecord[] = [
      {
        externalAuditRef: 'PA-AUD-2026-0142',
        schemeRef: 'iso27001',
        clientName: 'Northwind Logistics',
        auditType: 'Stage 2',
        scheduledDate: new Date('2026-08-18'),
        completedDate: null,
        result: null,
      },
      {
        externalAuditRef: 'PA-AUD-2026-0139',
        schemeRef: 'iso9001',
        clientName: 'Bank ABC',
        auditType: 'Surveillance',
        scheduledDate: new Date('2026-07-30'),
        completedDate: new Date('2026-07-31'),
        result: 'Pass',
      },
    ].filter((r) => !schemeRef || r.schemeRef === schemeRef);
    await this.recordStubSync('AuditExecution', data.length);
    return data;
  }

  async getTechnicalReviewQueue(): Promise<TechnicalReviewItem[]> {
    const data: TechnicalReviewItem[] = [
      {
        externalReviewRef: 'PA-TR-2026-0087',
        clientName: 'Northwind Logistics',
        schemeRef: 'iso27001',
        reviewerName: 'S. Okafor',
        queuedSince: new Date('2026-08-05'),
        status: 'In Queue',
      },
    ];
    await this.recordStubSync('TechnicalReview', data.length);
    return data;
  }

  async getCertificationDecisions(schemeRef?: string): Promise<CertificationDecisionRecord[]> {
    const data: CertificationDecisionRecord[] = [
      {
        externalDecisionRef: 'PA-DEC-2026-0031',
        clientName: 'Bank ABC',
        schemeRef: 'iso9001',
        decision: 'Certify',
        decisionMaker: 'L. Bianchi',
        decidedAt: new Date('2026-08-01'),
      },
    ].filter((r) => !schemeRef || r.schemeRef === schemeRef);
    await this.recordStubSync('CertificationDecision', data.length);
    return data;
  }

  private async recordStubSync(
    domain: 'Lifecycle' | 'AuditExecution' | 'TechnicalReview' | 'CertificationDecision',
    recordsSynced: number,
  ): Promise<void> {
    await this.syncLog.record({
      systemCode: 'PLATFORM_AUDIT',
      domain,
      recordsSynced,
      status: 'Success',
      errorMessage: null,
    });
  }
}

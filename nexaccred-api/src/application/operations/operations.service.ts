import { Inject, Injectable } from '@nestjs/common';
import {
  AuditExecutionRecord,
  CertificationDecisionRecord,
  OPERATIONS_PORT,
  OperationsPort,
  TechnicalReviewItem,
  WorkloadAggregate,
} from '../../domain/ports/operations.port';

/**
 * Thin pass-through over OperationsPort today — there is no NexAccred-side
 * business logic for Platform Audit's four domains yet (PRD FR-12.4:
 * NexAccred never duplicates that operational execution). This service
 * exists as the seam controllers depend on, so real logic (workload
 * breakdowns, staleness warnings) has somewhere to land later without
 * touching the controller or the port.
 */
@Injectable()
export class OperationsService {
  constructor(@Inject(OPERATIONS_PORT) private readonly operations: OperationsPort) {}

  getCertificationActivityWorkload(): Promise<WorkloadAggregate[]> {
    return this.operations.getCertificationActivityWorkload();
  }

  getAuditExecutionRecords(schemeRef?: string): Promise<AuditExecutionRecord[]> {
    return this.operations.getAuditExecutionRecords(schemeRef);
  }

  getTechnicalReviewQueue(): Promise<TechnicalReviewItem[]> {
    return this.operations.getTechnicalReviewQueue();
  }

  getCertificationDecisions(schemeRef?: string): Promise<CertificationDecisionRecord[]> {
    return this.operations.getCertificationDecisions(schemeRef);
  }
}

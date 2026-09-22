import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateSchemeData,
  SCHEME_REPOSITORY_PORT,
  SchemeRepositoryPort,
  SchemeSummary,
  UpdateSchemeData,
} from '../../domain/ports/scheme.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';
import {
  computeOverallReadiness,
  computeReadiness,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
  getUpcomingAssessments,
} from '../../domain/readiness/readiness-engine';
import { Band, ReadinessResult, UpcomingAssessment } from '../../domain/readiness/types';

/**
 * Application-layer use-cases for the Scheme + Readiness bounded context.
 * This is the only place that wires the pure domain/readiness engine
 * together with persistence — controllers never call the engine directly,
 * and the engine never knows Prisma or NestJS exist. Swapping the ORM only
 * ever touches the SchemeRepositoryPort implementation.
 */
@Injectable()
export class SchemesService {
  constructor(
    @Inject(SCHEME_REPOSITORY_PORT) private readonly schemes: SchemeRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listSchemes(): Promise<SchemeSummary[]> {
    return this.schemes.findAll();
  }

  async getSchemeById(id: string): Promise<SchemeSummary> {
    const scheme = await this.schemes.findById(id);
    if (!scheme) {
      throw new NotFoundException(`Scheme "${id}" not found`);
    }
    return scheme;
  }

  async createScheme(data: CreateSchemeData, actorUserId: string | null): Promise<SchemeSummary> {
    const created = await this.schemes.create(data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'create',
      entityType: 'Scheme',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateScheme(
    id: string,
    data: UpdateSchemeData,
    actorUserId: string | null,
  ): Promise<SchemeSummary> {
    const before = await this.getSchemeById(id);
    const after = await this.schemes.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'update',
      entityType: 'Scheme',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async deleteScheme(id: string, actorUserId: string | null): Promise<void> {
    const before = await this.getSchemeById(id);
    await this.schemes.delete(id);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'delete',
      entityType: 'Scheme',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }

  async getSchemeReadiness(schemeId: string): Promise<ReadinessResult> {
    const snapshot = await this.schemes.getReadinessSnapshot(schemeId);
    if (!snapshot) {
      throw new NotFoundException(`Scheme "${schemeId}" not found`);
    }
    return computeReadiness(snapshot, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
  }

  async getOverallReadiness(): Promise<{ score: number; band: Band }> {
    const snapshots = await this.schemes.getAllReadinessSnapshots();
    return computeOverallReadiness(snapshots, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
  }

  async getUpcomingAssessments(): Promise<UpcomingAssessment[]> {
    const snapshots = await this.schemes.getAllReadinessSnapshots();
    return getUpcomingAssessments(snapshots, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
  }
}

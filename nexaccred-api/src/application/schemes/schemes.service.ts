import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  SCHEME_REPOSITORY_PORT,
  SchemeRepositoryPort,
  SchemeSummary,
} from '../../domain/ports/scheme.repository.port';
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
  ) {}

  listSchemes(): Promise<SchemeSummary[]> {
    return this.schemes.findAll();
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SchemeRepositoryPort, SchemeSummary } from '../../../domain/ports/scheme.repository.port';
import { Pillar, SchemeReadinessSnapshot } from '../../../domain/readiness/types';

@Injectable()
export class SchemePrismaRepository implements SchemeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SchemeSummary[]> {
    const schemes = await this.prisma.scheme.findMany();
    return schemes.map((s) => ({
      id: s.id,
      name: s.name,
      fullName: s.fullName,
      lifecycleStatus: s.lifecycleStatus,
      accreditationBodyId: s.accreditationBodyId,
    }));
  }

  async findById(schemeId: string): Promise<SchemeSummary | null> {
    const s = await this.prisma.scheme.findUnique({ where: { id: schemeId } });
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      fullName: s.fullName,
      lifecycleStatus: s.lifecycleStatus,
      accreditationBodyId: s.accreditationBodyId,
    };
  }

  async getReadinessSnapshot(schemeId: string): Promise<SchemeReadinessSnapshot | null> {
    const scheme = await this.prisma.scheme.findUnique({ where: { id: schemeId } });
    if (!scheme) return null;
    return this.toSnapshot(scheme);
  }

  async getAllReadinessSnapshots(): Promise<SchemeReadinessSnapshot[]> {
    const schemes = await this.prisma.scheme.findMany();
    return Promise.all(schemes.map((s) => this.toSnapshot(s)));
  }

  private async toSnapshot(scheme: {
    id: string;
    name: string;
    lifecycleStatus: 'draft' | 'active' | 'suspended';
  }): Promise<SchemeReadinessSnapshot> {
    const [pillarScoreRows, openCriticalFindings, witnessCycle, nextAssessment] = await Promise.all([
      this.prisma.schemePillarScore.findMany({ where: { schemeId: scheme.id } }),
      // "Critical gap" = an open Major Nonconformity — the most severe
      // classification a finding can carry (Data Model §2, FindingClassification).
      this.prisma.finding.count({
        where: { schemeId: scheme.id, classification: 'MajorNC', status: 'Open' },
      }),
      this.prisma.witnessCycle.findFirst({
        where: { schemeId: scheme.id },
        orderBy: { cycleEnd: 'desc' },
      }),
      this.prisma.assessment.findFirst({
        where: { schemeId: scheme.id, scheduledDate: { gte: new Date() } },
        orderBy: { scheduledDate: 'asc' },
      }),
    ]);

    const pillarScores: Partial<Record<Pillar, number>> = {};
    for (const row of pillarScoreRows) {
      pillarScores[row.pillar as Pillar] = row.scorePct;
    }

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      lifecycleStatus: scheme.lifecycleStatus,
      pillarScores,
      openCriticalFindingsCount: openCriticalFindings,
      witness: witnessCycle
        ? { required: witnessCycle.requiredCount, completed: witnessCycle.completedCount }
        : null,
      nextAssessment:
        nextAssessment && nextAssessment.scheduledDate
          ? { type: nextAssessment.assessmentType, date: nextAssessment.scheduledDate }
          : null,
    };
  }
}

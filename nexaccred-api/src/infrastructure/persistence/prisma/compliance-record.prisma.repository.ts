import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ComplianceRecordRepositoryPort,
  ComplianceRecordSummary,
  CreateComplianceRecordInput,
} from '../../../domain/ports/compliance-record.repository.port';

@Injectable()
export class ComplianceRecordPrismaRepository implements ComplianceRecordRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: { schemeId?: string; requirementId?: string }): Promise<ComplianceRecordSummary[]> {
    const records = await this.prisma.complianceRecord.findMany({
      where: { schemeId: filter?.schemeId, requirementId: filter?.requirementId },
    });
    return records.map((r) => this.toSummary(r));
  }

  async create(input: CreateComplianceRecordInput): Promise<ComplianceRecordSummary> {
    const r = await this.prisma.complianceRecord.create({
      data: {
        requirementId: input.requirementId,
        schemeId: input.schemeId,
        complianceStatus: input.complianceStatus,
        lastAssessed: input.lastAssessed,
        assessedById: input.assessedById,
      },
    });
    return this.toSummary(r);
  }

  private toSummary(r: {
    id: string;
    requirementId: string;
    schemeId: string;
    complianceStatus: string;
    lastAssessed: Date | null;
    assessedById: string | null;
  }): ComplianceRecordSummary {
    return {
      id: r.id,
      requirementId: r.requirementId,
      schemeId: r.schemeId,
      complianceStatus: r.complianceStatus,
      lastAssessed: r.lastAssessed,
      assessedById: r.assessedById,
    };
  }
}

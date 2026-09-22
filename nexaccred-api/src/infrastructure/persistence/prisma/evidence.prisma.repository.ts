import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateEvidenceData,
  EvidenceRepositoryPort,
  EvidenceSummary,
  UpdateEvidenceData,
} from '../../../domain/ports/evidence.repository.port';

@Injectable()
export class EvidencePrismaRepository implements EvidenceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<EvidenceSummary[]> {
    const rows = await this.prisma.evidence.findMany();
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<EvidenceSummary | null> {
    const row = await this.prisma.evidence.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByComplianceRecord(complianceRecordId: string): Promise<EvidenceSummary[]> {
    const rows = await this.prisma.evidence.findMany({
      where: { complianceRecordId },
    });
    return rows.map(this.toDomain);
  }

  async create(data: CreateEvidenceData): Promise<EvidenceSummary> {
    const row = await this.prisma.evidence.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateEvidenceData): Promise<EvidenceSummary> {
    const row = await this.prisma.evidence.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.evidence.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    complianceRecordId: string;
    evidenceCode: string;
    evidenceCategory: string;
    evidenceStatus: string;
    validFrom: Date | null;
    validUntil: Date | null;
    approved: boolean;
    uploadedAt: Date;
  }): EvidenceSummary {
    return {
      id: row.id,
      complianceRecordId: row.complianceRecordId,
      evidenceCode: row.evidenceCode,
      evidenceCategory: row.evidenceCategory as EvidenceSummary['evidenceCategory'],
      evidenceStatus: row.evidenceStatus,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      approved: row.approved,
      uploadedAt: row.uploadedAt,
    };
  }
}

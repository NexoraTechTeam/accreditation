import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateFindingData,
  FindingRepositoryPort,
  FindingSummary,
  UpdateFindingData,
} from '../../../domain/ports/finding.repository.port';

@Injectable()
export class FindingPrismaRepository implements FindingRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<FindingSummary[]> {
    const rows = await this.prisma.finding.findMany();
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<FindingSummary | null> {
    const row = await this.prisma.finding.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateFindingData): Promise<FindingSummary> {
    const row = await this.prisma.finding.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateFindingData): Promise<FindingSummary> {
    const row = await this.prisma.finding.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.finding.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    findingCode: string;
    requirementId: string;
    schemeId: string;
    assessmentId: string | null;
    source: string;
    classification: string;
    status: string;
    ownerUserId: string | null;
    dueDate: Date | null;
  }): FindingSummary {
    return {
      id: row.id,
      findingCode: row.findingCode,
      requirementId: row.requirementId,
      schemeId: row.schemeId,
      assessmentId: row.assessmentId,
      source: row.source,
      classification: row.classification as FindingSummary['classification'],
      status: row.status,
      ownerUserId: row.ownerUserId,
      dueDate: row.dueDate,
    };
  }
}

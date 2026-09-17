import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateRiskData,
  RiskRepositoryPort,
  RiskSummary,
  UpdateRiskData,
} from '../../../domain/ports/risk.repository.port';

@Injectable()
export class RiskPrismaRepository implements RiskRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RiskSummary[]> {
    const rows = await this.prisma.risk.findMany();
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<RiskSummary | null> {
    const row = await this.prisma.risk.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateRiskData): Promise<RiskSummary> {
    const row = await this.prisma.risk.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateRiskData): Promise<RiskSummary> {
    const row = await this.prisma.risk.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.risk.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    riskCode: string;
    category: string;
    description: string;
    schemeId: string | null;
    requirementId: string | null;
    likelihood: string;
    impact: string;
    status: string;
  }): RiskSummary {
    return {
      id: row.id,
      riskCode: row.riskCode,
      category: row.category,
      description: row.description,
      schemeId: row.schemeId,
      requirementId: row.requirementId,
      likelihood: row.likelihood,
      impact: row.impact,
      status: row.status,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ClauseSummary,
  CreateStandardInput,
  StandardDetail,
  StandardRepositoryPort,
  StandardSummary,
  StandardVersionSummary,
  UpdateStandardInput,
} from '../../../domain/ports/standard.repository.port';

@Injectable()
export class StandardPrismaRepository implements StandardRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<StandardSummary[]> {
    const standards = await this.prisma.standard.findMany();
    return standards.map((s) => this.toSummary(s));
  }

  async findById(id: string): Promise<StandardDetail | null> {
    const standard = await this.prisma.standard.findUnique({
      where: { id },
      include: { versions: { include: { clauses: true } } },
    });
    if (!standard) return null;

    const versions: StandardVersionSummary[] = standard.versions.map((v) => ({
      id: v.id,
      versionLabel: v.versionLabel,
      effectiveDate: v.effectiveDate,
      supersededDate: v.supersededDate,
      clauses: v.clauses.map((c): ClauseSummary => ({
        id: c.id,
        clauseNumber: c.clauseNumber,
        title: c.title,
      })),
    }));

    return { ...this.toSummary(standard), versions };
  }

  async create(input: CreateStandardInput): Promise<StandardSummary> {
    const s = await this.prisma.standard.create({
      data: {
        name: input.name,
        type: input.type,
        issuer: input.issuer,
        description: input.description,
        status: input.status,
      },
    });
    return this.toSummary(s);
  }

  async update(id: string, input: UpdateStandardInput): Promise<StandardSummary> {
    const s = await this.prisma.standard.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        issuer: input.issuer,
        description: input.description,
        status: input.status,
      },
    });
    return this.toSummary(s);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.standard.delete({ where: { id } });
  }

  private toSummary(s: {
    id: string;
    name: string;
    type: string;
    issuer: string;
    description: string | null;
    status: string;
  }): StandardSummary {
    return {
      id: s.id,
      name: s.name,
      type: s.type,
      issuer: s.issuer,
      description: s.description,
      status: s.status,
    };
  }
}

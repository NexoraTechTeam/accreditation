import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateRequirementInput,
  RequirementRepositoryPort,
  RequirementSummary,
  UpdateRequirementInput,
} from '../../../domain/ports/requirement.repository.port';
import { RequirementType } from '@prisma/client';

@Injectable()
export class RequirementPrismaRepository implements RequirementRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: { clauseId?: string }): Promise<RequirementSummary[]> {
    const requirements = await this.prisma.requirement.findMany({
      where: { clauseId: filter?.clauseId },
    });
    return requirements.map((r) => this.toSummary(r));
  }

  async findById(id: string): Promise<RequirementSummary | null> {
    const r = await this.prisma.requirement.findUnique({ where: { id } });
    return r ? this.toSummary(r) : null;
  }

  async create(input: CreateRequirementInput): Promise<RequirementSummary> {
    const r = await this.prisma.requirement.create({
      data: {
        refCode: input.refCode,
        clauseId: input.clauseId,
        requirementText: input.requirementText,
        requirementType: input.requirementType,
        mandatory: input.mandatory,
        effectiveDate: input.effectiveDate,
        expiryDate: input.expiryDate,
      },
    });
    return this.toSummary(r);
  }

  async update(id: string, input: UpdateRequirementInput): Promise<RequirementSummary> {
    const r = await this.prisma.requirement.update({
      where: { id },
      data: {
        refCode: input.refCode,
        clauseId: input.clauseId,
        requirementText: input.requirementText,
        requirementType: input.requirementType,
        mandatory: input.mandatory,
        effectiveDate: input.effectiveDate,
        expiryDate: input.expiryDate,
      },
    });
    return this.toSummary(r);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.requirement.delete({ where: { id } });
  }

  private toSummary(r: {
    id: string;
    refCode: string;
    clauseId: string;
    requirementText: string;
    requirementType: RequirementType;
    mandatory: boolean;
    effectiveDate: Date;
    expiryDate: Date | null;
  }): RequirementSummary {
    return {
      id: r.id,
      refCode: r.refCode,
      clauseId: r.clauseId,
      requirementText: r.requirementText,
      requirementType: r.requirementType,
      mandatory: r.mandatory,
      effectiveDate: r.effectiveDate,
      expiryDate: r.expiryDate,
    };
  }
}

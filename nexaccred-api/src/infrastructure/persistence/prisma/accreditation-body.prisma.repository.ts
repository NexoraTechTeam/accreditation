import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  AccreditationBodyRepositoryPort,
  AccreditationBodySummary,
  CreateAccreditationBodyInput,
  UpdateAccreditationBodyInput,
} from '../../../domain/ports/accreditation-body.repository.port';

@Injectable()
export class AccreditationBodyPrismaRepository implements AccreditationBodyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AccreditationBodySummary[]> {
    const bodies = await this.prisma.accreditationBody.findMany();
    return bodies.map((b) => this.toSummary(b));
  }

  async findById(id: string): Promise<AccreditationBodySummary | null> {
    const b = await this.prisma.accreditationBody.findUnique({ where: { id } });
    return b ? this.toSummary(b) : null;
  }

  async create(input: CreateAccreditationBodyInput): Promise<AccreditationBodySummary> {
    const b = await this.prisma.accreditationBody.create({
      data: {
        shortName: input.shortName,
        fullName: input.fullName,
        country: input.country,
        accreditationNumber: input.accreditationNumber,
        accreditedSince: input.accreditedSince,
        status: input.status,
      },
    });
    return this.toSummary(b);
  }

  async update(id: string, input: UpdateAccreditationBodyInput): Promise<AccreditationBodySummary> {
    const b = await this.prisma.accreditationBody.update({
      where: { id },
      data: {
        shortName: input.shortName,
        fullName: input.fullName,
        country: input.country,
        accreditationNumber: input.accreditationNumber,
        accreditedSince: input.accreditedSince,
        status: input.status,
      },
    });
    return this.toSummary(b);
  }

  private toSummary(b: {
    id: string;
    shortName: string;
    fullName: string;
    country: string;
    accreditationNumber: string;
    accreditedSince: Date;
    status: string;
  }): AccreditationBodySummary {
    return {
      id: b.id,
      shortName: b.shortName,
      fullName: b.fullName,
      country: b.country,
      accreditationNumber: b.accreditationNumber,
      accreditedSince: b.accreditedSince,
      status: b.status,
    };
  }
}

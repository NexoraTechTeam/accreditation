import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CapaRepositoryPort,
  CapaSummary,
  CreateCapaData,
  UpdateCapaData,
} from '../../../domain/ports/capa.repository.port';

@Injectable()
export class CapaPrismaRepository implements CapaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CapaSummary[]> {
    const rows = await this.prisma.capa.findMany();
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<CapaSummary | null> {
    const row = await this.prisma.capa.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateCapaData): Promise<CapaSummary> {
    const row = await this.prisma.capa.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateCapaData): Promise<CapaSummary> {
    const row = await this.prisma.capa.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.capa.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    capaCode: string;
    findingId: string;
    stage: string;
    ownerUserId: string | null;
    dueDate: Date | null;
    closedDate: Date | null;
  }): CapaSummary {
    return {
      id: row.id,
      capaCode: row.capaCode,
      findingId: row.findingId,
      stage: row.stage as CapaSummary['stage'],
      ownerUserId: row.ownerUserId,
      dueDate: row.dueDate,
      closedDate: row.closedDate,
    };
  }
}

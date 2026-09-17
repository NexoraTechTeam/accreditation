import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateRequiredDocumentTypeInput,
  RequiredDocumentTypeRecord,
  RequiredDocumentTypeRepositoryPort,
  UpdateRequiredDocumentTypeInput,
} from '../../../domain/ports/required-document-type.repository.port';

@Injectable()
export class RequiredDocumentTypePrismaRepository implements RequiredDocumentTypeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RequiredDocumentTypeRecord[]> {
    return this.prisma.requiredDocumentType.findMany();
  }

  async findById(id: string): Promise<RequiredDocumentTypeRecord | null> {
    return this.prisma.requiredDocumentType.findUnique({ where: { id } });
  }

  async create(input: CreateRequiredDocumentTypeInput): Promise<RequiredDocumentTypeRecord> {
    return this.prisma.requiredDocumentType.create({
      data: {
        schemeId: input.schemeId ?? null,
        typeName: input.typeName,
        fulfillmentStatus: input.fulfillmentStatus,
      },
    });
  }

  async update(id: string, input: UpdateRequiredDocumentTypeInput): Promise<RequiredDocumentTypeRecord> {
    return this.prisma.requiredDocumentType.update({
      where: { id },
      data: {
        schemeId: input.schemeId,
        typeName: input.typeName,
        fulfillmentStatus: input.fulfillmentStatus,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.requiredDocumentType.delete({ where: { id } });
  }
}

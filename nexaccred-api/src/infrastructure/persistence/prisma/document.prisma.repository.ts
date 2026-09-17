import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateDocumentInput,
  DocumentRecord,
  DocumentRepositoryPort,
  UpdateDocumentInput,
} from '../../../domain/ports/document.repository.port';

@Injectable()
export class DocumentPrismaRepository implements DocumentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DocumentRecord[]> {
    return this.prisma.document.findMany();
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    return this.prisma.document.create({
      data: {
        name: input.name,
        docType: input.docType,
        version: input.version,
        ownerUserId: input.ownerUserId,
        lastReviewed: input.lastReviewed ?? null,
        status: input.status,
      },
    });
  }

  async update(id: string, input: UpdateDocumentInput): Promise<DocumentRecord> {
    return this.prisma.document.update({
      where: { id },
      data: {
        name: input.name,
        docType: input.docType,
        version: input.version,
        ownerUserId: input.ownerUserId,
        lastReviewed: input.lastReviewed,
        status: input.status,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({ where: { id } });
  }
}

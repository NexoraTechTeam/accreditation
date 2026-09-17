import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  AuditTrailEntry,
  AuditTrailRecord,
  AuditTrailRepositoryPort,
} from '../../../domain/ports/audit-trail.repository.port';

@Injectable()
export class AuditTrailPrismaRepository implements AuditTrailRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditTrailEntry): Promise<void> {
    await this.prisma.auditTrail.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeAfter: entry.beforeAfter ? JSON.parse(JSON.stringify(entry.beforeAfter)) : undefined,
      },
    });
  }

  async list(filter?: { entityType?: string; userId?: string; limit?: number }): Promise<AuditTrailRecord[]> {
    const rows = await this.prisma.auditTrail.findMany({
      where: { entityType: filter?.entityType, userId: filter?.userId },
      orderBy: { occurredAt: 'desc' },
      take: filter?.limit ?? 200,
    });
    return rows.map((r) => ({
      id: r.id,
      occurredAt: r.occurredAt,
      userId: r.userId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      beforeAfter: r.beforeAfter as { before: unknown; after: unknown } | null,
    }));
  }
}

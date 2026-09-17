import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ExternalSyncDomain,
  ExternalSyncLogEntry,
  ExternalSyncLogRepositoryPort,
  ExternalSystemCode,
} from '../../../domain/ports/external-sync-log.repository.port';

@Injectable()
export class ExternalSyncLogPrismaRepository implements ExternalSyncLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: Omit<ExternalSyncLogEntry, 'lastSyncedAt'>): Promise<void> {
    const system = await this.prisma.externalSystem.findUnique({
      where: { code: entry.systemCode },
    });
    if (!system) {
      // Config gap, not a runtime failure worth crashing the request over —
      // an unregistered ExternalSystem row means the System Administrator
      // hasn't set up this integration yet (RBAC §Administration).
      return;
    }
    await this.prisma.externalSyncLog.create({
      data: {
        externalSystemId: system.id,
        domain: entry.domain,
        recordsSynced: entry.recordsSynced,
        status: entry.status,
        errorMessage: entry.errorMessage,
      },
    });
  }

  async getLatest(
    systemCode: ExternalSystemCode,
    domain: ExternalSyncDomain,
  ): Promise<ExternalSyncLogEntry | null> {
    const row = await this.prisma.externalSyncLog.findFirst({
      where: { domain, externalSystem: { code: systemCode } },
      orderBy: { lastSyncedAt: 'desc' },
      include: { externalSystem: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async getLatestForAllDomains(): Promise<ExternalSyncLogEntry[]> {
    const systems = await this.prisma.externalSystem.findMany();
    const entries: ExternalSyncLogEntry[] = [];
    for (const system of systems) {
      const latestByDomain = await this.prisma.externalSyncLog.findMany({
        where: { externalSystemId: system.id },
        orderBy: { lastSyncedAt: 'desc' },
        distinct: ['domain'],
        include: { externalSystem: true },
      });
      entries.push(...latestByDomain.map((row) => this.toDomain(row)));
    }
    return entries;
  }

  private toDomain(row: {
    domain: string;
    lastSyncedAt: Date;
    recordsSynced: number;
    status: string;
    errorMessage: string | null;
    externalSystem: { code: string };
  }): ExternalSyncLogEntry {
    return {
      systemCode: row.externalSystem.code as ExternalSystemCode,
      domain: row.domain as ExternalSyncDomain,
      lastSyncedAt: row.lastSyncedAt,
      recordsSynced: row.recordsSynced,
      status: row.status as ExternalSyncLogEntry['status'],
      errorMessage: row.errorMessage,
    };
  }
}

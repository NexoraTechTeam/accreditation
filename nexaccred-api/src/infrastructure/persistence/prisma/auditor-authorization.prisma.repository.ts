import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  AuditorAuthorization,
  AuditorAuthorizationRepositoryPort,
} from '../../../domain/ports/auditor-authorization.repository.port';

@Injectable()
export class AuditorAuthorizationPrismaRepository implements AuditorAuthorizationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listForPersonnel(personnelRef: string): Promise<AuditorAuthorization[]> {
    const rows = await this.prisma.auditorAuthorization.findMany({
      where: { personnelRef },
      orderBy: { expiryDate: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  async listExpiringWithin(days: number): Promise<AuditorAuthorization[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const rows = await this.prisma.auditorAuthorization.findMany({
      where: { status: 'Active', expiryDate: { lte: cutoff } },
      orderBy: { expiryDate: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  private toDomain(row: {
    id: string;
    personnelRef: string;
    schemeId: string | null;
    standardRef: string;
    authorizationRole: string;
    authorizedSince: Date;
    expiryDate: Date;
    status: string;
  }): AuditorAuthorization {
    return {
      id: row.id,
      personnelRef: row.personnelRef,
      schemeId: row.schemeId,
      standardRef: row.standardRef,
      authorizationRole: row.authorizationRole as AuditorAuthorization['authorizationRole'],
      authorizedSince: row.authorizedSince,
      expiryDate: row.expiryDate,
      status: row.status as AuditorAuthorization['status'],
    };
  }
}

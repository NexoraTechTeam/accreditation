import { Inject, Injectable } from '@nestjs/common';
import { AihcmConfig } from './aihcm.config';
import { AihcmAuthClient } from './aihcm-auth.client';
import { AihcmEmployeeCompetency, AihcmEmployeeProfileView } from './aihcm.types';
import {
  CompetencyRecord,
  PersonnelCompetencyPort,
  PersonnelProfile,
} from '../../../domain/ports/personnel-competency.port';
import { ExternalIntegrationUnavailableError } from '../../../domain/errors/external-integration-unavailable.error';
import {
  EXTERNAL_SYNC_LOG_REPOSITORY_PORT,
  ExternalSyncLogRepositoryPort,
} from '../../../domain/ports/external-sync-log.repository.port';

/**
 * Real HTTP adapter for AIHCM (Data Model §1.5). This is the one integration
 * in this codebase that talks to a genuinely running sibling application —
 * everything here is written against AIHCM's confirmed contract, not a
 * guess:
 *
 *   POST /api/v1/auth/login                              (AihcmAuthClient)
 *   GET  /api/v1/employees/{employeeId}                   → AihcmEmployeeProfileView
 *   GET  /api/v1/competencies/employees/{employeeId}      → AihcmEmployeeCompetency[]
 *   GET  /api/v1/competencies                             → AihcmCompetency[] (catalog, for name lookup)
 *
 * Translation into NexAccred's own PersonnelProfile/CompetencyRecord
 * vocabulary happens entirely in this file — nothing upstream of
 * PersonnelCompetencyPort ever sees an Aihcm* type. If AIHCM's DTOs change
 * shape in a future wave, this is the only file that needs to change.
 */
@Injectable()
export class AihcmHttpGateway implements PersonnelCompetencyPort {
  private competencyCatalogCache: Map<string, string> | null = null;

  constructor(
    private readonly config: AihcmConfig,
    private readonly auth: AihcmAuthClient,
    @Inject(EXTERNAL_SYNC_LOG_REPOSITORY_PORT) private readonly syncLog: ExternalSyncLogRepositoryPort,
  ) {}

  async getPersonnelProfile(personnelRef: string): Promise<PersonnelProfile | null> {
    const response = await this.request(`/api/v1/employees/${personnelRef}`);
    if (response.status === 404) {
      await this.syncLog.record({
        systemCode: 'AIHCM',
        domain: 'PersonnelCompetency',
        recordsSynced: 0,
        status: 'Success',
        errorMessage: null,
      });
      return null;
    }
    const dto = (await this.parse(response)) as AihcmEmployeeProfileView;

    await this.syncLog.record({
      systemCode: 'AIHCM',
      domain: 'PersonnelCompetency',
      recordsSynced: 1,
      status: 'Success',
      errorMessage: null,
    });

    return {
      personnelRef: dto.employeeId,
      fullName: dto.fullName,
      employeeNumber: dto.employeeNumber,
      jobTitle: dto.positionName,
      orgUnitName: dto.orgUnitName,
      status: dto.status,
    };
  }

  async listCompetencies(personnelRef: string): Promise<CompetencyRecord[]> {
    const [response, catalog] = await Promise.all([
      this.request(`/api/v1/competencies/employees/${personnelRef}`),
      this.getCompetencyCatalog(),
    ]);
    const dtos = (await this.parse(response)) as AihcmEmployeeCompetency[];

    await this.syncLog.record({
      systemCode: 'AIHCM',
      domain: 'PersonnelCompetency',
      recordsSynced: dtos.length,
      status: 'Success',
      errorMessage: null,
    });

    return dtos.map((dto) => ({
      competencyId: dto.competencyId,
      competencyCode: catalog.get(dto.competencyId) ?? dto.competencyId,
      competencyName: catalog.get(dto.competencyId) ?? '(unknown competency)',
      level: dto.level,
      selfAssessed: dto.selfAssessed,
      assessedAt: new Date(dto.assessedAt),
    }));
  }

  /** Cached for the process lifetime — the competency catalog is tenant-wide
   *  reference data, not per-employee, so it changes rarely. */
  private async getCompetencyCatalog(): Promise<Map<string, string>> {
    if (this.competencyCatalogCache) return this.competencyCatalogCache;
    const response = await this.request('/api/v1/competencies');
    const dtos = (await this.parse(response)) as { id: string; name: string }[];
    this.competencyCatalogCache = new Map(dtos.map((d) => [d.id, d.name]));
    return this.competencyCatalogCache;
  }

  private async request(path: string): Promise<Response> {
    const token = await this.auth.getAccessToken();
    try {
      return await fetch(`${this.config.baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (cause) {
      await this.recordFailure(cause);
      throw new ExternalIntegrationUnavailableError(
        'AIHCM',
        `Could not reach AIHCM at ${this.config.baseUrl}${path}`,
        cause,
      );
    }
  }

  private async parse(response: Response): Promise<unknown> {
    if (!response.ok) {
      const cause = new Error(`AIHCM returned HTTP ${response.status} for ${response.url}`);
      await this.recordFailure(cause);
      throw new ExternalIntegrationUnavailableError('AIHCM', cause.message, cause);
    }
    return response.json();
  }

  private async recordFailure(cause: unknown): Promise<void> {
    await this.syncLog.record({
      systemCode: 'AIHCM',
      domain: 'PersonnelCompetency',
      recordsSynced: 0,
      status: 'Failed',
      errorMessage: cause instanceof Error ? cause.message : String(cause),
    });
  }
}

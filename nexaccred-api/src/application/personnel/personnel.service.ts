import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PERSONNEL_COMPETENCY_PORT,
  PersonnelCompetencyPort,
} from '../../domain/ports/personnel-competency.port';
import {
  AUDITOR_AUTHORIZATION_REPOSITORY_PORT,
  AuditorAuthorization,
  AuditorAuthorizationRepositoryPort,
} from '../../domain/ports/auditor-authorization.repository.port';

export interface AuditorProfile {
  personnelRef: string;
  fullName: string;
  employeeNumber: string;
  jobTitle: string | null;
  /** From AIHCM — general proficiency levels, no expiry. */
  competencies: Awaited<ReturnType<PersonnelCompetencyPort['listCompetencies']>>;
  /** From NexAccred's own table — CAB-specific, time-bound. */
  authorizations: AuditorAuthorization[];
}

/**
 * Composes AIHCM's identity/competency data with NexAccred's own
 * AuditorAuthorization records into one profile. This composition — not a
 * database join — is exactly why AuditorAuthorization exists as a separate
 * local table instead of trying to extend AIHCM's schema: two systems of
 * record, joined at the application layer, each still owning only its own
 * facts (Data Model §2.7a).
 */
@Injectable()
export class PersonnelService {
  constructor(
    @Inject(PERSONNEL_COMPETENCY_PORT) private readonly personnel: PersonnelCompetencyPort,
    @Inject(AUDITOR_AUTHORIZATION_REPOSITORY_PORT)
    private readonly authorizations: AuditorAuthorizationRepositoryPort,
  ) {}

  async getAuditorProfile(personnelRef: string): Promise<AuditorProfile> {
    const profile = await this.personnel.getPersonnelProfile(personnelRef);
    if (!profile) {
      throw new NotFoundException(`No AIHCM personnel record for "${personnelRef}"`);
    }

    const [competencies, authorizations] = await Promise.all([
      this.personnel.listCompetencies(personnelRef),
      this.authorizations.listForPersonnel(personnelRef),
    ]);

    return {
      personnelRef: profile.personnelRef,
      fullName: profile.fullName,
      employeeNumber: profile.employeeNumber,
      jobTitle: profile.jobTitle,
      competencies,
      authorizations,
    };
  }

  listExpiringAuthorizations(withinDays: number): Promise<AuditorAuthorization[]> {
    return this.authorizations.listExpiringWithin(withinDays);
  }
}

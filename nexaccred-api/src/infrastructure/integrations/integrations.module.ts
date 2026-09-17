import { Module } from '@nestjs/common';
import { PERSONNEL_COMPETENCY_PORT } from '../../domain/ports/personnel-competency.port';
import { OPERATIONS_PORT } from '../../domain/ports/operations.port';
import { AihcmConfig } from './aihcm/aihcm.config';
import { AihcmAuthClient } from './aihcm/aihcm-auth.client';
import { AihcmHttpGateway } from './aihcm/aihcm-http.gateway';
import { PlatformAuditStubGateway } from './platform-audit/platform-audit-stub.gateway';
import { PersistenceModule } from '../persistence/persistence.module';

/**
 * The DI binding site for both external systems. This is the single place
 * that decides which concrete adapter answers PersonnelCompetencyPort and
 * OperationsPort — everything else in the app (application services,
 * controllers) only ever sees the port interfaces.
 *
 * AIHCM: bound to a real HTTP adapter — see aihcm-http.gateway.ts.
 * Platform Audit: bound to a stub — see platform-audit-stub.gateway.ts —
 * because no live Platform Audit application exists yet. Swapping to a real
 * adapter later is a one-line change in this file's `providers` array.
 */
@Module({
  imports: [PersistenceModule],
  providers: [
    AihcmConfig,
    AihcmAuthClient,
    AihcmHttpGateway,
    PlatformAuditStubGateway,
    { provide: PERSONNEL_COMPETENCY_PORT, useExisting: AihcmHttpGateway },
    { provide: OPERATIONS_PORT, useExisting: PlatformAuditStubGateway },
  ],
  exports: [PERSONNEL_COMPETENCY_PORT, OPERATIONS_PORT],
})
export class IntegrationsModule {}

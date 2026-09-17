import { Controller, Get, Inject } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import {
  EXTERNAL_SYNC_LOG_REPOSITORY_PORT,
  ExternalSyncLogRepositoryPort,
} from '../../domain/ports/external-sync-log.repository.port';
import { Auth } from '../auth/auth.decorator';

/**
 * Backs FR-12.2: "screens sourced from either system are clearly marked with
 * which system, sync status, and last-sync time." The frontend's per-screen
 * "Synced from Platform Audit" badge (nexaccred-react/src/components/
 * layout.jsx) should call this instead of being purely decorative.
 *
 * RBAC §3.1: "which external systems are connected" is explicitly System
 * Administrator's question to answer, hence Administration domain.
 */
@Controller('integrations')
@Auth(EntityDomain.Administration, AccessLevel.View)
export class IntegrationsStatusController {
  constructor(
    @Inject(EXTERNAL_SYNC_LOG_REPOSITORY_PORT) private readonly syncLog: ExternalSyncLogRepositoryPort,
  ) {}

  @Get('sync-status')
  getSyncStatus() {
    return this.syncLog.getLatestForAllDomains();
  }
}

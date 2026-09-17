import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { SCHEME_REPOSITORY_PORT } from '../../domain/ports/scheme.repository.port';
import { SchemePrismaRepository } from './prisma/scheme.prisma.repository';
import { AUDITOR_AUTHORIZATION_REPOSITORY_PORT } from '../../domain/ports/auditor-authorization.repository.port';
import { AuditorAuthorizationPrismaRepository } from './prisma/auditor-authorization.prisma.repository';
import { EXTERNAL_SYNC_LOG_REPOSITORY_PORT } from '../../domain/ports/external-sync-log.repository.port';
import { ExternalSyncLogPrismaRepository } from './prisma/external-sync-log.prisma.repository';
import { USER_REPOSITORY_PORT } from '../../domain/ports/user.repository.port';
import { UserPrismaRepository } from './prisma/user.prisma.repository';
import { AUDIT_TRAIL_REPOSITORY_PORT } from '../../domain/ports/audit-trail.repository.port';
import { AuditTrailPrismaRepository } from './prisma/audit-trail.prisma.repository';

/**
 * The only module aware that Prisma/PostgreSQL is the persistence
 * technology. Everything else in the app depends on the *_PORT tokens
 * exported here, not on these concrete classes — see domain/ports/*.
 *
 * New feature modules (Findings, CAPA, Requirements, Documents, …): bind
 * YOUR OWN new repository ports inside YOUR OWN feature module's providers
 * (importing PersistenceModule only for PrismaService) rather than adding
 * them here — keeps this file from becoming a merge-conflict magnet as
 * bounded contexts are added independently.
 */
@Module({
  providers: [
    PrismaService,
    { provide: SCHEME_REPOSITORY_PORT, useClass: SchemePrismaRepository },
    { provide: AUDITOR_AUTHORIZATION_REPOSITORY_PORT, useClass: AuditorAuthorizationPrismaRepository },
    { provide: EXTERNAL_SYNC_LOG_REPOSITORY_PORT, useClass: ExternalSyncLogPrismaRepository },
    { provide: USER_REPOSITORY_PORT, useClass: UserPrismaRepository },
    { provide: AUDIT_TRAIL_REPOSITORY_PORT, useClass: AuditTrailPrismaRepository },
  ],
  exports: [
    PrismaService,
    SCHEME_REPOSITORY_PORT,
    AUDITOR_AUTHORIZATION_REPOSITORY_PORT,
    EXTERNAL_SYNC_LOG_REPOSITORY_PORT,
    USER_REPOSITORY_PORT,
    AUDIT_TRAIL_REPOSITORY_PORT,
  ],
})
export class PersistenceModule {}

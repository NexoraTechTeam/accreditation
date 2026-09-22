import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { EVIDENCE_REPOSITORY_PORT } from '../domain/ports/evidence.repository.port';
import { EvidencePrismaRepository } from '../infrastructure/persistence/prisma/evidence.prisma.repository';
import { EvidenceService } from '../application/evidence/evidence.service';
import { EvidenceController } from '../interface/evidence/evidence.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, { provide: EVIDENCE_REPOSITORY_PORT, useClass: EvidencePrismaRepository }],
})
export class EvidenceModule {}

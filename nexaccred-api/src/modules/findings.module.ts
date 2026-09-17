import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { FINDING_REPOSITORY_PORT } from '../domain/ports/finding.repository.port';
import { FindingPrismaRepository } from '../infrastructure/persistence/prisma/finding.prisma.repository';
import { FindingsService } from '../application/findings/findings.service';
import { FindingsController } from '../interface/findings/findings.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [FindingsController],
  providers: [FindingsService, { provide: FINDING_REPOSITORY_PORT, useClass: FindingPrismaRepository }],
})
export class FindingsModule {}

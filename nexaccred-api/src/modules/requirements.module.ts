import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { REQUIREMENT_REPOSITORY_PORT } from '../domain/ports/requirement.repository.port';
import { RequirementPrismaRepository } from '../infrastructure/persistence/prisma/requirement.prisma.repository';
import { RequirementsService } from '../application/requirements/requirements.service';
import { RequirementsController } from '../interface/requirements/requirements.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [RequirementsController],
  providers: [
    RequirementsService,
    { provide: REQUIREMENT_REPOSITORY_PORT, useClass: RequirementPrismaRepository },
  ],
})
export class RequirementsModule {}

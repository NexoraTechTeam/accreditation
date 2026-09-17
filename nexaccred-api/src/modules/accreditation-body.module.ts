import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { ACCREDITATION_BODY_REPOSITORY_PORT } from '../domain/ports/accreditation-body.repository.port';
import { AccreditationBodyPrismaRepository } from '../infrastructure/persistence/prisma/accreditation-body.prisma.repository';
import { AccreditationBodyService } from '../application/accreditation-body/accreditation-body.service';
import { AccreditationBodyController } from '../interface/accreditation-body/accreditation-body.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [AccreditationBodyController],
  providers: [
    AccreditationBodyService,
    { provide: ACCREDITATION_BODY_REPOSITORY_PORT, useClass: AccreditationBodyPrismaRepository },
  ],
})
export class AccreditationBodyModule {}

import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { STANDARD_REPOSITORY_PORT } from '../domain/ports/standard.repository.port';
import { StandardPrismaRepository } from '../infrastructure/persistence/prisma/standard.prisma.repository';
import { StandardsService } from '../application/standards/standards.service';
import { StandardsController } from '../interface/standards/standards.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [StandardsController],
  providers: [StandardsService, { provide: STANDARD_REPOSITORY_PORT, useClass: StandardPrismaRepository }],
})
export class StandardsModule {}

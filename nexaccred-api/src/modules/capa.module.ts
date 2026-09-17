import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { CAPA_REPOSITORY_PORT } from '../domain/ports/capa.repository.port';
import { CapaPrismaRepository } from '../infrastructure/persistence/prisma/capa.prisma.repository';
import { CapaService } from '../application/capa/capa.service';
import { CapaController } from '../interface/capa/capa.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [CapaController],
  providers: [CapaService, { provide: CAPA_REPOSITORY_PORT, useClass: CapaPrismaRepository }],
})
export class CapaModule {}

import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { RISK_REPOSITORY_PORT } from '../domain/ports/risk.repository.port';
import { RiskPrismaRepository } from '../infrastructure/persistence/prisma/risk.prisma.repository';
import { RiskService } from '../application/risk/risk.service';
import { RiskController } from '../interface/risk/risk.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [RiskController],
  providers: [RiskService, { provide: RISK_REPOSITORY_PORT, useClass: RiskPrismaRepository }],
})
export class RiskModule {}

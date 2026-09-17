import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { COMPLIANCE_RECORD_REPOSITORY_PORT } from '../domain/ports/compliance-record.repository.port';
import { ComplianceRecordPrismaRepository } from '../infrastructure/persistence/prisma/compliance-record.prisma.repository';
import { ComplianceRecordService } from '../application/compliance/compliance-record.service';
import { ComplianceRecordController } from '../interface/compliance/compliance-record.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [ComplianceRecordController],
  providers: [
    ComplianceRecordService,
    { provide: COMPLIANCE_RECORD_REPOSITORY_PORT, useClass: ComplianceRecordPrismaRepository },
  ],
})
export class ComplianceModule {}

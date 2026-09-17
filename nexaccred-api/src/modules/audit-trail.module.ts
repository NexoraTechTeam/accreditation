import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { AuditTrailController } from '../interface/audit-trail/audit-trail.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [AuditTrailController],
})
export class AuditTrailModule {}

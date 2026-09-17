import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { IntegrationsStatusController } from '../interface/integrations/integrations-status.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [IntegrationsStatusController],
})
export class IntegrationsStatusModule {}

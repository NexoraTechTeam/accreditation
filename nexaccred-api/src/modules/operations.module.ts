import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../infrastructure/integrations/integrations.module';
import { OperationsService } from '../application/operations/operations.service';
import { OperationsController } from '../interface/operations/operations.controller';

@Module({
  imports: [IntegrationsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}

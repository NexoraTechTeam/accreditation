import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../infrastructure/integrations/integrations.module';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { PersonnelService } from '../application/personnel/personnel.service';
import { PersonnelController } from '../interface/personnel/personnel.controller';

@Module({
  imports: [IntegrationsModule, PersistenceModule],
  controllers: [PersonnelController],
  providers: [PersonnelService],
})
export class PersonnelModule {}

import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { SchemesService } from '../application/schemes/schemes.service';
import { SchemesController } from '../interface/schemes/schemes.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [SchemesController],
  providers: [SchemesService],
})
export class SchemesModule {}

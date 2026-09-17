import { IsEnum } from 'class-validator';
import { CAPA_STAGE_ORDER, CapaStage } from '../../../domain/ports/capa.repository.port';

export class UpdateCapaStageDto {
  @IsEnum(CAPA_STAGE_ORDER)
  stage!: CapaStage;
}

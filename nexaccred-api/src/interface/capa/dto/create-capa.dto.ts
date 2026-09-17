import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CAPA_STAGE_ORDER, CapaStage } from '../../../domain/ports/capa.repository.port';

export class CreateCapaDto {
  @IsString()
  @MinLength(1)
  capaCode!: string;

  @IsString()
  @MinLength(1)
  findingId!: string;

  @IsOptional()
  @IsEnum(CAPA_STAGE_ORDER)
  stage?: CapaStage;

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

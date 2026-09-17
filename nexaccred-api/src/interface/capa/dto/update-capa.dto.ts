import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Deliberately excludes `stage` — stage transitions go through the dedicated
 * PATCH /capa/:id/stage endpoint (see UpdateCapaStageDto) so the
 * forward-only validation in CapaService#advanceStage can't be bypassed via
 * a general-purpose field update.
 */
export class UpdateCapaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  findingId?: string;

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

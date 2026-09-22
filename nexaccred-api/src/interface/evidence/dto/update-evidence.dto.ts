import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { EvidenceCategory } from '../../../domain/ports/evidence.repository.port';

const EVIDENCE_CATEGORIES: EvidenceCategory[] = ['Document', 'Record', 'Operational', 'Personnel', 'System'];

export class UpdateEvidenceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  evidenceCode?: string;

  @IsOptional()
  @IsEnum(EVIDENCE_CATEGORIES)
  evidenceCategory?: EvidenceCategory;

  @IsOptional()
  @IsString()
  evidenceStatus?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}

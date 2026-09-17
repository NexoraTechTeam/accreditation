import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FindingClassification } from '../../../domain/ports/finding.repository.port';

const FINDING_CLASSIFICATIONS: FindingClassification[] = ['MajorNC', 'MinorNC', 'Observation', 'OFI'];

export class CreateFindingDto {
  @IsString()
  @MinLength(1)
  findingCode!: string;

  @IsString()
  @MinLength(1)
  requirementId!: string;

  @IsString()
  @MinLength(1)
  schemeId!: string;

  @IsOptional()
  @IsString()
  assessmentId?: string;

  @IsString()
  @MinLength(1)
  source!: string;

  @IsEnum(FINDING_CLASSIFICATIONS)
  classification!: FindingClassification;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

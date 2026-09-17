import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FindingClassification } from '../../../domain/ports/finding.repository.port';

const FINDING_CLASSIFICATIONS: FindingClassification[] = ['MajorNC', 'MinorNC', 'Observation', 'OFI'];

/**
 * All fields optional — every field is independently patchable. Written by
 * hand rather than via @nestjs/mapped-types' PartialType to avoid adding a
 * new dependency for a four-field DTO; keep in sync with CreateFindingDto
 * if fields change.
 */
export class UpdateFindingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  requirementId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  schemeId?: string;

  @IsOptional()
  @IsString()
  assessmentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  source?: string;

  @IsOptional()
  @IsEnum(FINDING_CLASSIFICATIONS)
  classification?: FindingClassification;

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

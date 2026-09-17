import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RequirementType } from '@prisma/client';

export class UpdateRequirementDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  refCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  clauseId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  requirementText?: string;

  @IsOptional()
  @IsEnum(RequirementType)
  requirementType?: RequirementType;

  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

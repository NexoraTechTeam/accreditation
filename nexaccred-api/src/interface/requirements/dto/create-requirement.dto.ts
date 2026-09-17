import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RequirementType } from '@prisma/client';

export class CreateRequirementDto {
  @IsString()
  @MinLength(1)
  refCode!: string;

  @IsString()
  @MinLength(1)
  clauseId!: string;

  @IsString()
  @MinLength(1)
  requirementText!: string;

  @IsEnum(RequirementType)
  requirementType!: RequirementType;

  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @IsDateString()
  effectiveDate!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

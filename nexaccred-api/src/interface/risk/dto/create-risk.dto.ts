import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRiskDto {
  @IsString()
  @MinLength(1)
  riskCode!: string;

  @IsString()
  @MinLength(1)
  category!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  schemeId?: string;

  @IsOptional()
  @IsString()
  requirementId?: string;

  @IsString()
  @MinLength(1)
  likelihood!: string;

  @IsString()
  @MinLength(1)
  impact!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRiskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsString()
  schemeId?: string;

  @IsOptional()
  @IsString()
  requirementId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  likelihood?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  impact?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

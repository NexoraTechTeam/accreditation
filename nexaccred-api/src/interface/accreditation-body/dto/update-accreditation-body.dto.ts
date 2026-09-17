import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAccreditationBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  shortName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  country?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  accreditationNumber?: string;

  @IsOptional()
  @IsDateString()
  accreditedSince?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

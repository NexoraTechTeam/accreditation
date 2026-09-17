import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAccreditationBodyDto {
  @IsString()
  @MinLength(1)
  shortName!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  country!: string;

  @IsString()
  @MinLength(1)
  accreditationNumber!: string;

  @IsDateString()
  accreditedSince!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const LIFECYCLE_STATUSES = ['draft', 'active', 'suspended'] as const;

export class CreateSchemeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  conformityType!: string;

  @IsString()
  @MinLength(1)
  accreditationBodyId!: string;

  @IsOptional()
  @IsIn(LIFECYCLE_STATUSES)
  lifecycleStatus?: 'draft' | 'active' | 'suspended';

  @IsOptional()
  clientCount?: number;
}

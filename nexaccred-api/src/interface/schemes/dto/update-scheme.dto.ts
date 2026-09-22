import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const LIFECYCLE_STATUSES = ['draft', 'active', 'suspended'] as const;

export class UpdateSchemeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  conformityType?: string;

  @IsOptional()
  @IsIn(LIFECYCLE_STATUSES)
  lifecycleStatus?: 'draft' | 'active' | 'suspended';

  @IsOptional()
  clientCount?: number;
}

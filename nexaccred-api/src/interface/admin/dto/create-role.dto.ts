import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  roleName!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

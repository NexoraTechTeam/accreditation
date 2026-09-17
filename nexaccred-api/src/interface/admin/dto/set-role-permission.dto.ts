import { IsEnum } from 'class-validator';
import { AccessLevel } from '@prisma/client';

export class SetRolePermissionDto {
  @IsEnum(AccessLevel)
  accessLevel!: AccessLevel;
}

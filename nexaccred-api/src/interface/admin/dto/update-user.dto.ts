import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const USER_STATUSES = ['Active', 'Inactive'] as const;

// No password field here by design — a self-service/reset password flow is
// a distinct, more sensitive use-case than general profile editing and is
// out of scope for this pass. Deactivation goes through `status`, matching
// the "no delete" contract in users-admin.service.ts's class-level comment.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: string;
}

import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const USER_STATUSES = ['Active', 'Inactive'] as const;

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsEmail()
  email!: string;

  // Plaintext on the wire, hashed with PasswordHasher before it ever reaches
  // the repository or the audit trail — see application/admin/users-admin.service.ts.
  @IsString()
  @MinLength(8)
  password!: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: string;
}

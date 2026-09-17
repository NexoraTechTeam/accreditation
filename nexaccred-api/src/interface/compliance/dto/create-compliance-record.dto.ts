import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const COMPLIANCE_STATUSES = ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Applicable'] as const;

export class CreateComplianceRecordDto {
  @IsString()
  @MinLength(1)
  requirementId!: string;

  @IsString()
  @MinLength(1)
  schemeId!: string;

  @IsIn(COMPLIANCE_STATUSES)
  complianceStatus!: string;

  @IsOptional()
  @IsDateString()
  lastAssessed?: string;

  @IsOptional()
  @IsString()
  assessedById?: string;
}

import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const FULFILLMENT_STATUSES = ['Missing', 'Partial', 'Fulfilled'] as const;

export class CreateRequiredDocumentTypeDto {
  // null / omitted = applies to all schemes (RequiredDocumentType.schemeId comment).
  @IsOptional()
  @IsUUID()
  schemeId?: string;

  @IsString()
  @MinLength(1)
  typeName!: string;

  @IsOptional()
  @IsIn(FULFILLMENT_STATUSES)
  fulfillmentStatus?: string;
}

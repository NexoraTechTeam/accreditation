import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const FULFILLMENT_STATUSES = ['Missing', 'Partial', 'Fulfilled'] as const;

export class UpdateRequiredDocumentTypeDto {
  @IsOptional()
  @IsUUID()
  schemeId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  typeName?: string;

  @IsOptional()
  @IsIn(FULFILLMENT_STATUSES)
  fulfillmentStatus?: string;
}

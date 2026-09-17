import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const DOCUMENT_STATUSES = ['Active', 'Archived', 'Superseded'] as const;

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  docType?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  version?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsDateString()
  lastReviewed?: string;

  @IsOptional()
  @IsIn(DOCUMENT_STATUSES)
  status?: string;
}

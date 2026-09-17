import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// Fixed judgement vocabulary for Document.status — kept as a plain string on
// the Prisma model (see schema.prisma comment), but the create/update
// surface still validates against the known values so a typo doesn't
// silently create an unrecognized status.
const DOCUMENT_STATUSES = ['Active', 'Archived', 'Superseded'] as const;

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  docType!: string;

  @IsString()
  @MinLength(1)
  version!: string;

  @IsUUID()
  ownerUserId!: string;

  @IsOptional()
  @IsDateString()
  lastReviewed?: string;

  @IsOptional()
  @IsIn(DOCUMENT_STATUSES)
  status?: string;
}

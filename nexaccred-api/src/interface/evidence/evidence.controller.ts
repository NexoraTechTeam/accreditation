import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { EvidenceService } from '../../application/evidence/evidence.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';

/**
 * RBAC §1: Evidence falls under the Evidence domain.
 */
@Controller('evidence')
@Auth(EntityDomain.Evidence, AccessLevel.View)
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Get()
  list(@Query('complianceRecordId') complianceRecordId?: string) {
    if (complianceRecordId) {
      return this.evidence.listByComplianceRecord(complianceRecordId);
    }
    return this.evidence.listEvidence();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.evidence.getEvidence(id);
  }

  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateEvidenceDto, @Req() req: AuthenticatedRequest) {
    return this.evidence.createEvidence(
      {
        ...dto,
        evidenceStatus: dto.evidenceStatus || 'Missing',
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEvidenceDto, @Req() req: AuthenticatedRequest) {
    return this.evidence.updateEvidence(
      id,
      {
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.evidence.deleteEvidence(id, req.user.sub);
  }
}

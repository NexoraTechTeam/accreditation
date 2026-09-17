import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { ComplianceRecordService } from '../../application/compliance/compliance-record.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';

// RBAC §1: ComplianceRecord falls under the Requirements domain
// ("Accreditation Bodies, Standards, Schemes, Requirements, Compliance").
// List + create only — see application/compliance/compliance-record.service.ts
// for why there is no update/delete route here.
@Controller('compliance-records')
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class ComplianceRecordController {
  constructor(private readonly complianceRecords: ComplianceRecordService) {}

  @Get()
  list(@Query('schemeId') schemeId?: string, @Query('requirementId') requirementId?: string) {
    return this.complianceRecords.listComplianceRecords({ schemeId, requirementId });
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateComplianceRecordDto, @Req() req: AuthenticatedRequest) {
    return this.complianceRecords.createComplianceRecord(
      {
        requirementId: dto.requirementId,
        schemeId: dto.schemeId,
        complianceStatus: dto.complianceStatus,
        lastAssessed: dto.lastAssessed ? new Date(dto.lastAssessed) : new Date(),
        assessedById: dto.assessedById ?? req.user.sub,
      },
      req.user.sub,
    );
  }
}

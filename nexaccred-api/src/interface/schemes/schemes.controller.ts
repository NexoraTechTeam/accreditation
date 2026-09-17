import { Controller, Get, Param } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { SchemesService } from '../../application/schemes/schemes.service';
import { Auth } from '../auth/auth.decorator';

// RBAC §1: Schemes fall under the Requirements domain ("Accreditation
// Bodies, Standards, Schemes, Requirements, Compliance").
@Controller()
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class SchemesController {
  constructor(private readonly schemes: SchemesService) {}

  @Get('schemes')
  list() {
    return this.schemes.listSchemes();
  }

  @Get('schemes/:id/readiness')
  readiness(@Param('id') id: string) {
    return this.schemes.getSchemeReadiness(id);
  }

  @Get('readiness/overall')
  overall() {
    return this.schemes.getOverallReadiness();
  }

  @Get('readiness/upcoming-assessments')
  upcoming() {
    return this.schemes.getUpcomingAssessments();
  }
}

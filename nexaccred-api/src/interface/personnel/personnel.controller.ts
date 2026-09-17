import { Controller, Get, Param, Query } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { PersonnelService } from '../../application/personnel/personnel.service';
import { Auth } from '../auth/auth.decorator';

/**
 * Backs the Personnel & Competence screen (AIHCM-sourced, per PRD FR-12.1a).
 * `:personnelRef` is AIHCM's employeeId, treated as an opaque external
 * identifier throughout — see domain/ports/personnel-competency.port.ts.
 */
@Controller('personnel')
@Auth(EntityDomain.Personnel, AccessLevel.View)
export class PersonnelController {
  constructor(private readonly personnel: PersonnelService) {}

  // Static route declared before ':personnelRef' — Nest/Express match in
  // declaration order, so this must come first or "expiring" would be
  // captured as a personnelRef.
  @Get('authorizations/expiring')
  listExpiring(@Query('withinDays') withinDays = '30') {
    return this.personnel.listExpiringAuthorizations(Number(withinDays));
  }

  @Get(':personnelRef')
  getProfile(@Param('personnelRef') personnelRef: string) {
    return this.personnel.getAuditorProfile(personnelRef);
  }
}

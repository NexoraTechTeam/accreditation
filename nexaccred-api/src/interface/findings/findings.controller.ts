import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { FindingsService } from '../../application/findings/findings.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';

/**
 * RBAC §1: Findings fall under the FindingsCAPA domain. Class-level @Auth
 * grants read access at View; every mutating handler below layers its own
 * method-level @Auth on top (Reflector.getAllAndOverride in
 * permissions.guard.ts makes the method-level metadata win over the class
 * default, confirmed by reading that guard).
 *
 * '/findings/:id/close' specifically requires Approve, not Edit — closing a
 * finding is the higher-stakes, Head-of-Accreditation-tier decision the RBAC
 * matrix's Approve level is reserved for, distinct from ordinary editing of
 * finding fields.
 */
@Controller('findings')
@Auth(EntityDomain.FindingsCAPA, AccessLevel.View)
export class FindingsController {
  constructor(private readonly findings: FindingsService) {}

  @Get()
  list() {
    return this.findings.listFindings();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.findings.getFinding(id);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateFindingDto, @Req() req: AuthenticatedRequest) {
    return this.findings.createFinding(
      {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFindingDto, @Req() req: AuthenticatedRequest) {
    return this.findings.updateFinding(
      id,
      {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.findings.deleteFinding(id, req.user.sub);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Approve)
  @Post(':id/close')
  close(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.findings.closeFinding(id, req.user.sub);
  }
}

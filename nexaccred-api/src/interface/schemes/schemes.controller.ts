import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { SchemesService } from '../../application/schemes/schemes.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateSchemeDto } from './dto/create-scheme.dto';
import { UpdateSchemeDto } from './dto/update-scheme.dto';

/**
 * RBAC §1: Schemes fall under the Requirements domain ("Accreditation
 * Bodies, Standards, Schemes, Requirements, Compliance").
 */
@Controller()
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class SchemesController {
  constructor(private readonly schemes: SchemesService) {}

  @Get('schemes')
  list() {
    return this.schemes.listSchemes();
  }

  @Get('schemes/:id')
  get(@Param('id') id: string) {
    return this.schemes.getSchemeById(id);
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Post('schemes')
  create(@Body() dto: CreateSchemeDto, @Req() req: AuthenticatedRequest) {
    return this.schemes.createScheme(dto, req.user.sub);
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Patch('schemes/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSchemeDto, @Req() req: AuthenticatedRequest) {
    return this.schemes.updateScheme(id, dto, req.user.sub);
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Delete('schemes/:id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.schemes.deleteScheme(id, req.user.sub);
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

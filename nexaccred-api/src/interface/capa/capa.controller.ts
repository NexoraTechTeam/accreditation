import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { CapaService } from '../../application/capa/capa.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateCapaDto } from './dto/create-capa.dto';
import { UpdateCapaDto } from './dto/update-capa.dto';
import { UpdateCapaStageDto } from './dto/update-capa-stage.dto';

/**
 * RBAC §1: Capa falls under the FindingsCAPA domain. Class-level @Auth
 * grants read access at View; every mutating handler layers its own
 * method-level @Auth on top (method-level metadata wins over class-level —
 * see permissions.guard.ts's Reflector.getAllAndOverride).
 *
 * 'PATCH /capa/:id/stage' stays at Edit level even when the target stage is
 * 'Closed' — a CAPA reaching its terminal stage through the normal linear
 * workflow is routine casework carried out by the assigned owner, not the
 * distinct compliance judgement of closing the originating Finding (which
 * requires Approve — see findings.controller.ts). Keeping this endpoint at
 * one uniform level also avoids conditionally re-deriving the required
 * access level from request body content, which the permission model
 * (declared per-route, not per-payload) isn't built for.
 */
@Controller('capa')
@Auth(EntityDomain.FindingsCAPA, AccessLevel.View)
export class CapaController {
  constructor(private readonly capa: CapaService) {}

  @Get()
  list() {
    return this.capa.listCapas();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.capa.getCapa(id);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateCapaDto, @Req() req: AuthenticatedRequest) {
    return this.capa.createCapa(
      {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCapaDto, @Req() req: AuthenticatedRequest) {
    return this.capa.updateCapa(
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
    return this.capa.deleteCapa(id, req.user.sub);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Patch(':id/stage')
  advanceStage(@Param('id') id: string, @Body() dto: UpdateCapaStageDto, @Req() req: AuthenticatedRequest) {
    return this.capa.advanceStage(id, dto.stage, req.user.sub);
  }
}

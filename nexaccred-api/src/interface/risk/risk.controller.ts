import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { RiskService } from '../../application/risk/risk.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

// RBAC §1: Risk falls under the FindingsCAPA domain.
@Controller('risks')
@Auth(EntityDomain.FindingsCAPA, AccessLevel.View)
export class RiskController {
  constructor(private readonly risks: RiskService) {}

  @Get()
  list() {
    return this.risks.listRisks();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.risks.getRisk(id);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateRiskDto, @Req() req: AuthenticatedRequest) {
    return this.risks.createRisk(dto, req.user.sub);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRiskDto, @Req() req: AuthenticatedRequest) {
    return this.risks.updateRisk(id, dto, req.user.sub);
  }

  @Auth(EntityDomain.FindingsCAPA, AccessLevel.Edit)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.risks.deleteRisk(id, req.user.sub);
  }
}

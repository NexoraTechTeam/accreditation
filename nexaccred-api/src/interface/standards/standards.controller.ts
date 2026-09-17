import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { StandardsService } from '../../application/standards/standards.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateStandardDto } from './dto/create-standard.dto';
import { UpdateStandardDto } from './dto/update-standard.dto';

// RBAC §1: Standard falls under the Requirements domain. StandardVersion and
// Clause are read-only children exposed only via GET :id (see StandardsService).
@Controller('standards')
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class StandardsController {
  constructor(private readonly standards: StandardsService) {}

  @Get()
  list() {
    return this.standards.listStandards();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.standards.getStandard(id);
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateStandardDto, @Req() req: AuthenticatedRequest) {
    return this.standards.createStandard(
      {
        name: dto.name,
        type: dto.type,
        issuer: dto.issuer,
        description: dto.description,
        status: dto.status,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStandardDto, @Req() req: AuthenticatedRequest) {
    return this.standards.updateStandard(
      id,
      {
        name: dto.name,
        type: dto.type,
        issuer: dto.issuer,
        description: dto.description,
        status: dto.status,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.standards.deleteStandard(id, req.user.sub);
  }
}

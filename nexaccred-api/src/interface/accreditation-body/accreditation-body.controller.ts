import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { AccreditationBodyService } from '../../application/accreditation-body/accreditation-body.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateAccreditationBodyDto } from './dto/create-accreditation-body.dto';
import { UpdateAccreditationBodyDto } from './dto/update-accreditation-body.dto';

// RBAC §1: AccreditationBody falls under the Requirements domain
// ("Accreditation Bodies, Standards, Schemes, Requirements, Compliance").
@Controller('accreditation-bodies')
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class AccreditationBodyController {
  constructor(private readonly accreditationBodies: AccreditationBodyService) {}

  @Get()
  list() {
    return this.accreditationBodies.listAccreditationBodies();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.accreditationBodies.getAccreditationBody(id);
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateAccreditationBodyDto, @Req() req: AuthenticatedRequest) {
    return this.accreditationBodies.createAccreditationBody(
      {
        shortName: dto.shortName,
        fullName: dto.fullName,
        country: dto.country,
        accreditationNumber: dto.accreditationNumber,
        accreditedSince: new Date(dto.accreditedSince),
        status: dto.status,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAccreditationBodyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.accreditationBodies.updateAccreditationBody(
      id,
      {
        shortName: dto.shortName,
        fullName: dto.fullName,
        country: dto.country,
        accreditationNumber: dto.accreditationNumber,
        accreditedSince: dto.accreditedSince ? new Date(dto.accreditedSince) : undefined,
        status: dto.status,
      },
      req.user.sub,
    );
  }
}

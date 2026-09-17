import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { RequirementsService } from '../../application/requirements/requirements.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';

// RBAC §1: Requirement falls under the Requirements domain.
@Controller('requirements')
@Auth(EntityDomain.Requirements, AccessLevel.View)
export class RequirementsController {
  constructor(private readonly requirements: RequirementsService) {}

  @Get()
  list(@Query('clauseId') clauseId?: string) {
    return this.requirements.listRequirements(clauseId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.requirements.getRequirement(id);
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Post()
  create(@Body() dto: CreateRequirementDto, @Req() req: AuthenticatedRequest) {
    return this.requirements.createRequirement(
      {
        refCode: dto.refCode,
        clauseId: dto.clauseId,
        requirementText: dto.requirementText,
        requirementType: dto.requirementType,
        mandatory: dto.mandatory,
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequirementDto, @Req() req: AuthenticatedRequest) {
    return this.requirements.updateRequirement(
      id,
      {
        refCode: dto.refCode,
        clauseId: dto.clauseId,
        requirementText: dto.requirementText,
        requirementType: dto.requirementType,
        mandatory: dto.mandatory,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Auth(EntityDomain.Requirements, AccessLevel.Edit)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.requirements.deleteRequirement(id, req.user.sub);
  }
}

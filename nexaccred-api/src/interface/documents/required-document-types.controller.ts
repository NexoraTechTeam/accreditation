import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { RequiredDocumentTypesService } from '../../application/documents/required-document-types.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateRequiredDocumentTypeDto } from './dto/create-required-document-type.dto';
import { UpdateRequiredDocumentTypeDto } from './dto/update-required-document-type.dto';

// RBAC §1: Required Document Types fall under the Evidence domain, same as Documents.
@Controller('required-document-types')
@Auth(EntityDomain.Evidence, AccessLevel.View)
export class RequiredDocumentTypesController {
  constructor(private readonly requiredDocumentTypes: RequiredDocumentTypesService) {}

  @Get()
  list() {
    return this.requiredDocumentTypes.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.requiredDocumentTypes.get(id);
  }

  @Post()
  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  create(@Body() dto: CreateRequiredDocumentTypeDto, @Req() req: AuthenticatedRequest) {
    return this.requiredDocumentTypes.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRequiredDocumentTypeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.requiredDocumentTypes.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.requiredDocumentTypes.remove(id, req.user.sub);
  }
}

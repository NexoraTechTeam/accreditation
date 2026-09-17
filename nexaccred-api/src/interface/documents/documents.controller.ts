import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { DocumentsService } from '../../application/documents/documents.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

// RBAC §1: Documents fall under the Evidence domain ("Documents, Evidence
// Repository, Forms, Records, Required Document Types").
@Controller('documents')
@Auth(EntityDomain.Evidence, AccessLevel.View)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list() {
    return this.documents.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.documents.get(id);
  }

  @Post()
  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  create(@Body() dto: CreateDocumentDto, @Req() req: AuthenticatedRequest) {
    return this.documents.create(
      {
        ...dto,
        lastReviewed: dto.lastReviewed ? new Date(dto.lastReviewed) : null,
      },
      req.user.sub,
    );
  }

  @Patch(':id')
  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @Req() req: AuthenticatedRequest) {
    return this.documents.update(
      id,
      {
        ...dto,
        lastReviewed: dto.lastReviewed !== undefined ? new Date(dto.lastReviewed) : undefined,
      },
      req.user.sub,
    );
  }

  @Delete(':id')
  @Auth(EntityDomain.Evidence, AccessLevel.Edit)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documents.remove(id, req.user.sub);
  }
}

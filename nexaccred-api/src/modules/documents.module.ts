import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { DOCUMENT_REPOSITORY_PORT } from '../domain/ports/document.repository.port';
import { DocumentPrismaRepository } from '../infrastructure/persistence/prisma/document.prisma.repository';
import { REQUIRED_DOCUMENT_TYPE_REPOSITORY_PORT } from '../domain/ports/required-document-type.repository.port';
import { RequiredDocumentTypePrismaRepository } from '../infrastructure/persistence/prisma/required-document-type.prisma.repository';
import { DocumentsService } from '../application/documents/documents.service';
import { RequiredDocumentTypesService } from '../application/documents/required-document-types.service';
import { DocumentsController } from '../interface/documents/documents.controller';
import { RequiredDocumentTypesController } from '../interface/documents/required-document-types.controller';

// Binds its own repository ports locally (see persistence.module.ts's note
// on new feature modules) — only PrismaService and AUDIT_TRAIL_REPOSITORY_PORT
// are pulled from PersistenceModule.
@Module({
  imports: [PersistenceModule],
  controllers: [DocumentsController, RequiredDocumentTypesController],
  providers: [
    { provide: DOCUMENT_REPOSITORY_PORT, useClass: DocumentPrismaRepository },
    { provide: REQUIRED_DOCUMENT_TYPE_REPOSITORY_PORT, useClass: RequiredDocumentTypePrismaRepository },
    DocumentsService,
    RequiredDocumentTypesService,
  ],
})
export class DocumentsModule {}

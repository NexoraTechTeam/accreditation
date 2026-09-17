import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './interface/health/health.controller';
import { AuthModule } from './modules/auth.module';
import { SchemesModule } from './modules/schemes.module';
import { PersonnelModule } from './modules/personnel.module';
import { OperationsModule } from './modules/operations.module';
import { IntegrationsStatusModule } from './modules/integrations-status.module';
import { AuditTrailModule } from './modules/audit-trail.module';
import { AccreditationBodyModule } from './modules/accreditation-body.module';
import { StandardsModule } from './modules/standards.module';
import { RequirementsModule } from './modules/requirements.module';
import { ComplianceModule } from './modules/compliance.module';
import { FindingsModule } from './modules/findings.module';
import { CapaModule } from './modules/capa.module';
import { RiskModule } from './modules/risk.module';
import { TasksModule } from './modules/tasks.module';
import { DocumentsModule } from './modules/documents.module';
import { AdminModule } from './modules/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SchemesModule,
    PersonnelModule,
    OperationsModule,
    IntegrationsStatusModule,
    AuditTrailModule,
    AccreditationBodyModule,
    StandardsModule,
    RequirementsModule,
    ComplianceModule,
    FindingsModule,
    CapaModule,
    RiskModule,
    TasksModule,
    DocumentsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

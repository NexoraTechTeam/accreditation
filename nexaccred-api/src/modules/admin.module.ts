import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { ROLE_REPOSITORY_PORT } from '../domain/ports/role.repository.port';
import { RolePrismaRepository } from '../infrastructure/persistence/prisma/role.prisma.repository';
import { UsersAdminService } from '../application/admin/users-admin.service';
import { RolesAdminService } from '../application/admin/roles-admin.service';
import { UsersAdminController } from '../interface/admin/users-admin.controller';
import { RolesAdminController } from '../interface/admin/roles-admin.controller';

// Houses both Users and Roles (RolePermission included) — both live under
// the single Administration entity domain per RBAC §1, so one feature
// module for both avoids a near-empty roles-only module.
//
// USER_REPOSITORY_PORT is NOT bound here: User CRUD extends the *existing*
// domain/ports/user.repository.port.ts (see that file's doc comment for
// why), and PersistenceModule already binds + exports that token via
// UserPrismaRepository — importing PersistenceModule is enough.
// PasswordHasher is likewise not re-provided here: AuthModule is @Global()
// and already exports it app-wide (see modules/auth.module.ts).
//
// ROLE_REPOSITORY_PORT is new, so — matching persistence.module.ts's note
// for new feature modules — it's bound locally here rather than added to
// PersistenceModule.
@Module({
  imports: [PersistenceModule],
  controllers: [UsersAdminController, RolesAdminController],
  providers: [
    { provide: ROLE_REPOSITORY_PORT, useClass: RolePrismaRepository },
    UsersAdminService,
    RolesAdminService,
  ],
})
export class AdminModule {}

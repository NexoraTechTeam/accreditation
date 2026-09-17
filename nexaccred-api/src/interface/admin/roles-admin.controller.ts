import { Body, Controller, Get, Param, ParseEnumPipe, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { RolesAdminService } from '../../application/admin/roles-admin.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionDto } from './dto/set-role-permission.dto';

// RBAC §1: Roles + RolePermission fall under the Administration domain.
@Controller('roles')
@Auth(EntityDomain.Administration, AccessLevel.View)
export class RolesAdminController {
  constructor(private readonly roles: RolesAdminService) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.roles.get(id);
  }

  // No update/delete — see roles-admin.service.ts's class-level comment.
  @Post()
  @Auth(EntityDomain.Administration, AccessLevel.Approve)
  create(@Body() dto: CreateRoleDto, @Req() req: AuthenticatedRequest) {
    return this.roles.create(dto, req.user.sub);
  }

  // The highest-stakes endpoint in this bounded context — see
  // application/admin/roles-admin.service.ts#setPermission for the full
  // self-escalation guard explanation (RBAC §5 / §3.1).
  @Patch(':roleId/permissions/:entityDomain')
  @Auth(EntityDomain.Administration, AccessLevel.Approve)
  setPermission(
    @Param('roleId') roleId: string,
    @Param('entityDomain', new ParseEnumPipe(EntityDomain)) entityDomain: EntityDomain,
    @Body() dto: SetRolePermissionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roles.setPermission(req.user, roleId, entityDomain, dto.accessLevel);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AccessLevel, EntityDomain } from '@prisma/client';
import { UsersAdminService } from '../../application/admin/users-admin.service';
import { Auth } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// RBAC §1: Users fall under the Administration domain. Create/update
// require Approve specifically, not just Edit — RBAC §3.1 calls out "who
// can log into the system?" as a decision reserved for the System
// Administrator's top permission tier, and the matrix (§2) gives System
// Administrator Approve on Administration precisely so this is possible.
@Controller('users')
@Auth(EntityDomain.Administration, AccessLevel.View)
export class UsersAdminController {
  constructor(private readonly users: UsersAdminService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Post()
  @Auth(EntityDomain.Administration, AccessLevel.Approve)
  create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.users.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Auth(EntityDomain.Administration, AccessLevel.Approve)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    return this.users.update(id, dto, req.user.sub);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { TasksService } from '../../application/tasks/tasks.service';
import { Authenticated } from '../auth/auth.decorator';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * Tasks are deliberately NOT gated by any single EntityDomain. Per
 * 05-RBAC-Separation-of-Duties.md (repo root, one level up from
 * nexaccred-api), the RBAC domain list is Requirements / Evidence /
 * Personnel / FindingsCAPA / Reporting / Administration — none of which
 * Tasks map onto cleanly, because a Task's `sourceRef` polymorphically
 * traces back to a Requirement, Finding, Capa, or Risk (see Data Model
 * §2.8), each of which sits in a different RBAC domain. Tasks also surface
 * in 5 of the 6 roles' navigation (that doc's role/nav table), so pinning
 * them to any one domain would either over-restrict roles that legitimately
 * need their own task queue or force a domain-guessing heuristic per row.
 * We therefore use @Authenticated() — any logged-in user may manage tasks —
 * rather than @Auth(domain, level). Row-level narrowing (e.g. "only see
 * tasks assigned to me or my scheme") is left to the application layer /
 * future work, same as the rest of this bounded-context slice.
 */
@Controller('tasks')
@Authenticated()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  // Static route declared before ':id' — Nest/Express match in declaration
  // order, so this must come first or "overdue" would be captured as an id.
  @Get('overdue')
  overdue() {
    return this.tasks.listOverdue();
  }

  @Get()
  list() {
    return this.tasks.listTasks();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tasks.getTask(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: AuthenticatedRequest) {
    return this.tasks.createTask(
      {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: AuthenticatedRequest) {
    return this.tasks.updateTask(
      id,
      {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      req.user.sub,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.tasks.deleteTask(id, req.user.sub);
  }
}

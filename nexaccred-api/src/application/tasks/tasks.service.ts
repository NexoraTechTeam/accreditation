import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateTaskData,
  TASK_REPOSITORY_PORT,
  TaskRepositoryPort,
  TaskSummary,
  UpdateTaskData,
} from '../../domain/ports/task.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the Task bounded context. Tasks are not
 * scoped under any single RBAC entity domain — see
 * interface/tasks/tasks.controller.ts for why.
 */
@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY_PORT) private readonly tasks: TaskRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listTasks(): Promise<TaskSummary[]> {
    return this.tasks.findAll();
  }

  /** Computed at request time from status + dueDate — never a stored field. See task.repository.port.ts. */
  listOverdue(): Promise<TaskSummary[]> {
    return this.tasks.findOverdue(new Date());
  }

  async getTask(id: string): Promise<TaskSummary> {
    const task = await this.tasks.findById(id);
    if (!task) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return task;
  }

  async createTask(data: CreateTaskData, actorUserId: string | null): Promise<TaskSummary> {
    const created = await this.tasks.create(data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'create',
      entityType: 'Task',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateTask(id: string, data: UpdateTaskData, actorUserId: string | null): Promise<TaskSummary> {
    const before = await this.getTask(id);
    const after = await this.tasks.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'update',
      entityType: 'Task',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async deleteTask(id: string, actorUserId: string | null): Promise<void> {
    const before = await this.getTask(id);
    await this.tasks.delete(id);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'delete',
      entityType: 'Task',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}

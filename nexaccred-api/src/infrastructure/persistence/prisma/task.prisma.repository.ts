import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  CreateTaskData,
  TaskRepositoryPort,
  TaskSummary,
  UpdateTaskData,
} from '../../../domain/ports/task.repository.port';

@Injectable()
export class TaskPrismaRepository implements TaskRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TaskSummary[]> {
    const rows = await this.prisma.task.findMany();
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<TaskSummary | null> {
    const row = await this.prisma.task.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateTaskData): Promise<TaskSummary> {
    const row = await this.prisma.task.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskSummary> {
    const row = await this.prisma.task.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async findOverdue(now: Date): Promise<TaskSummary[]> {
    const rows = await this.prisma.task.findMany({
      where: { status: { not: 'Done' }, dueDate: { lt: now } },
    });
    return rows.map(this.toDomain);
  }

  private toDomain(row: {
    id: string;
    taskCode: string;
    title: string;
    schemeId: string | null;
    sourceRef: string | null;
    capaId: string | null;
    assigneeUserId: string | null;
    dueDate: Date | null;
    status: string;
    priority: string;
  }): TaskSummary {
    return {
      id: row.id,
      taskCode: row.taskCode,
      title: row.title,
      schemeId: row.schemeId,
      sourceRef: row.sourceRef,
      capaId: row.capaId,
      assigneeUserId: row.assigneeUserId,
      dueDate: row.dueDate,
      status: row.status as TaskSummary['status'],
      priority: row.priority as TaskSummary['priority'],
    };
  }
}

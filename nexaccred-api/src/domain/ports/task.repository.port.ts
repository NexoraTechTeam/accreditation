export type TaskStatus = 'NotStarted' | 'InProgress' | 'Done';
export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TaskSummary {
  id: string;
  taskCode: string;
  title: string;
  schemeId: string | null;
  sourceRef: string | null;
  capaId: string | null;
  assigneeUserId: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface CreateTaskData {
  taskCode: string;
  title: string;
  schemeId?: string | null;
  sourceRef?: string | null;
  capaId?: string | null;
  assigneeUserId?: string | null;
  dueDate?: Date | null;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export type UpdateTaskData = Partial<CreateTaskData>;

export const TASK_REPOSITORY_PORT = Symbol('TASK_REPOSITORY_PORT');

/**
 * Outbound port for the Task aggregate. Tasks are NOT scoped to
 * EntityDomain.FindingsCAPA — `sourceRef` is a deliberately untyped
 * polymorphic pointer back to whatever raised the task (a Requirement, a
 * Finding, a Capa, a Risk — see Data Model §2.8), so Tasks don't cleanly
 * belong to any single RBAC domain. See interface/tasks/tasks.controller.ts
 * for the full reasoning and its reference to 05-RBAC-Separation-of-Duties.md.
 */
export interface TaskRepositoryPort {
  findAll(): Promise<TaskSummary[]>;
  findById(id: string): Promise<TaskSummary | null>;
  create(data: CreateTaskData): Promise<TaskSummary>;
  update(id: string, data: UpdateTaskData): Promise<TaskSummary>;
  delete(id: string): Promise<void>;

  /**
   * "Overdue" is never stored — it's status != Done AND dueDate < now,
   * computed at query time. See readiness-engine.ts's file comment for why
   * this codebase treats derivable state as a bug, not an optimization:
   * a stored flag can silently drift from the fields it was computed from.
   */
  findOverdue(now: Date): Promise<TaskSummary[]>;
}

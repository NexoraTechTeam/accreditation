import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../domain/ports/task.repository.port';

const TASK_STATUSES: TaskStatus[] = ['NotStarted', 'InProgress', 'Done'];
const TASK_PRIORITIES: TaskPriority[] = ['Critical', 'High', 'Medium', 'Low'];

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  taskCode!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  schemeId?: string;

  // Polymorphic pointer back to the originating requirement/finding/capa/risk —
  // deliberately free text, not validated against any one entity type. See
  // domain/ports/task.repository.port.ts and Data Model §2.8.
  @IsOptional()
  @IsString()
  sourceRef?: string;

  @IsOptional()
  @IsString()
  capaId?: string;

  @IsOptional()
  @IsString()
  assigneeUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TASK_PRIORITIES)
  priority?: TaskPriority;
}

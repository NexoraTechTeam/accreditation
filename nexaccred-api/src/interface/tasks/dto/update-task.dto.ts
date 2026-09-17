import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../domain/ports/task.repository.port';

const TASK_STATUSES: TaskStatus[] = ['NotStarted', 'InProgress', 'Done'];
const TASK_PRIORITIES: TaskPriority[] = ['Critical', 'High', 'Medium', 'Low'];

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  schemeId?: string;

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

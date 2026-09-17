import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { TASK_REPOSITORY_PORT } from '../domain/ports/task.repository.port';
import { TaskPrismaRepository } from '../infrastructure/persistence/prisma/task.prisma.repository';
import { TasksService } from '../application/tasks/tasks.service';
import { TasksController } from '../interface/tasks/tasks.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [TasksController],
  providers: [TasksService, { provide: TASK_REPOSITORY_PORT, useClass: TaskPrismaRepository }],
})
export class TasksModule {}

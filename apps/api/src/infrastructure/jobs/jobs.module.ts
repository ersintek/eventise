import { Global, Module } from '@nestjs/common';
import { DatabaseJobQueue } from './database-job-queue';
import { JobQueue } from './job-queue.port';
import { JobRunnerService } from './job-runner.service';
@Global() @Module({ providers: [DatabaseJobQueue, JobRunnerService, { provide: JobQueue, useExisting: DatabaseJobQueue }], exports: [JobQueue, JobRunnerService] }) export class JobsModule {}

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { JobRunnerService } from './infrastructure/jobs/job-runner.service';

async function bootstrapWorker() {
  const context = await NestFactory.createApplicationContext(AppModule);
  const runner = context.get(JobRunnerService), workerId = `worker-${randomUUID()}`;
  const loop = async () => { const worked = await runner.runNext(workerId); setTimeout(() => void loop(), worked ? 50 : 1000).unref(); };
  await loop();
}
void bootstrapWorker();

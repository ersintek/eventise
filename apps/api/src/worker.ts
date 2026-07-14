import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { EmailProvider } from './infrastructure/email/email-provider.port';
import { JobRunnerService } from './infrastructure/jobs/job-runner.service';

async function bootstrapWorker() {
  const context = await NestFactory.createApplicationContext(AppModule);
  const runner = context.get(JobRunnerService), email = context.get(EmailProvider), workerId = `worker-${randomUUID()}`;
  runner.register('email.send', async payload => { await email.send(payload as unknown as Parameters<EmailProvider['send']>[0]); });
  const loop = async () => { const worked = await runner.runNext(workerId); setTimeout(loop, worked ? 50 : 1000).unref(); };
  await loop();
}
void bootstrapWorker();

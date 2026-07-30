import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';

@Injectable()
export class EventLifecycleService implements OnModuleInit {
  constructor(@Inject(JobRunnerService) private runner: JobRunnerService) {}

  onModuleInit() {
    // Eski sürümlerden kuyrukta kalmış otomatik kapanış görevlerini
    // hiçbir etkinlik aracını kapatmadan güvenle tamamla.
    this.runner.register('event.close_temporary_modules', async () => {});
  }
}

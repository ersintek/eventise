import { Controller, Get, Inject, Put, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../../modules/identity/policies/public.decorator';
import { DevelopmentStorageProvider } from './development-storage-provider';

@Public()
@Controller('development-storage')
export class DevelopmentStorageController {
  constructor(
    @Inject(DevelopmentStorageProvider) private readonly storage: DevelopmentStorageProvider,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private enabled() {
    return this.config.get('NODE_ENV') !== 'production';
  }

  @Put()
  put(@Query('key') key: string, @Req() req: Request, @Res() res: Response) {
    if (!this.enabled() || !key) return res.sendStatus(404);
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      this.storage.store(key, Buffer.concat(chunks));
      res.sendStatus(204);
    });
  }

  @Get()
  get(@Query('key') key: string, @Res() res: Response) {
    if (!this.enabled() || !key) return res.sendStatus(404);
    const data = this.storage.get(key);
    if (!data) return res.sendStatus(404);
    return res.send(data);
  }
}

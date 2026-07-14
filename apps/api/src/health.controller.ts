import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/identity/policies/public.decorator';
@Controller('health') export class HealthController { @Public() @Get() health() { return { status: 'ok' }; } }

import { Global, Module } from '@nestjs/common';
import { DevelopmentEmailProvider } from './development-email-provider';
import { EmailProvider } from './email-provider.port';
import { ConfigService } from '@nestjs/config';
import { SmtpEmailProvider } from './smtp-email-provider';
@Global() @Module({ providers: [DevelopmentEmailProvider, { provide: EmailProvider, inject: [ConfigService, DevelopmentEmailProvider], useFactory: (config: ConfigService, development: DevelopmentEmailProvider) => config.get('NODE_ENV') === 'production' ? new SmtpEmailProvider(config) : development }], exports: [EmailProvider] }) export class EmailModule {}

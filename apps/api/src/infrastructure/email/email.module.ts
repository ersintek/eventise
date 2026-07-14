import { Global, Module } from '@nestjs/common';
import { DevelopmentEmailProvider } from './development-email-provider';
import { EmailProvider } from './email-provider.port';
@Global() @Module({ providers: [DevelopmentEmailProvider, { provide: EmailProvider, useExisting: DevelopmentEmailProvider }], exports: [EmailProvider] }) export class EmailModule {}

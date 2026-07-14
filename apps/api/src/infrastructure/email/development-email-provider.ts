import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { EmailDeliveryResult, EmailMessage, EmailProvider } from './email-provider.port';
@Injectable()
export class DevelopmentEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    return { providerMessageId: `dev_${createHash('sha256').update(message.idempotencyKey).digest('hex').slice(0, 20)}`, accepted: true };
  }
}

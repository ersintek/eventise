import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { EmailDeliveryResult, EmailMessage, EmailProvider } from './email-provider.port';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({ host: config.getOrThrow('SMTP_HOST'), port: Number(config.get('SMTP_PORT', 587)), secure: config.get('SMTP_SECURE') === 'true', auth: { user: config.getOrThrow('SMTP_USER'), pass: config.getOrThrow('SMTP_PASSWORD') } });
  }
  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const result = await this.transporter.sendMail({ from: this.config.getOrThrow('EMAIL_FROM'), to: message.to, subject: message.subject, html: message.html, replyTo: message.replyTo, headers: { 'X-Eventise-Idempotency-Key': message.idempotencyKey } });
    return { providerMessageId: result.messageId, accepted: result.accepted.length > 0 };
  }
}

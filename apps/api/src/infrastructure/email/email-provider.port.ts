export interface EmailMessage { to: string; subject: string; html: string; replyTo?: string; idempotencyKey: string; }
export interface EmailDeliveryResult { providerMessageId: string; accepted: boolean; }
export abstract class EmailProvider { abstract send(message: EmailMessage): Promise<EmailDeliveryResult>; }

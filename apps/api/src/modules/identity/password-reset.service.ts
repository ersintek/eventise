import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { PrismaService } from '../../shared/persistence/prisma.service';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JobQueue) private readonly jobs: JobQueue,
  ) {}

  async request(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (user?.status === 'ACTIVE') {
      const token = randomBytes(32).toString('base64url');
      const reset = await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
        return tx.passwordResetToken.create({
          data: { userId: user.id, tokenHash: this.digest(token), expiresAt: new Date(Date.now() + 60 * 60_000) },
        });
      });
      const base = (process.env.PUBLIC_APP_URL ?? '').replace(/\/$/, '');
      const url = `${base}/reset-password?token=${encodeURIComponent(token)}`;
      const message = await this.prisma.emailMessage.create({
        data: {
          recipient: normalized,
          subject: 'Eventise şifrenizi yenileyin',
          body: `<p>Eventise şifrenizi yenilemek için aşağıdaki bağlantıyı kullanın:</p><p><a href="${url}">Şifremi yenile</a></p><p>Bu bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.</p>`,
        },
      });
      await this.jobs.enqueue({ type: 'email.send', payload: { messageId: message.id }, idempotencyKey: `password-reset:${reset.id}` });
    }
    return { requested: true };
  }

  async complete(token: string, password: string) {
    const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: this.digest(token) } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      throw new BadRequestException('Şifre yenileme bağlantısı geçersiz, kullanılmış veya süresi dolmuş.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hash(password, 12) } }),
      this.prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    ]);
    return { completed: true };
  }

  private digest(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}

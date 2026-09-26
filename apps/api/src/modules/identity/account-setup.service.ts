import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { toPublicUrl } from '../communications/public-url';

const accountSetupLifetimeMs = 7 * 24 * 60 * 60_000;

@Injectable()
export class AccountSetupService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(JobQueue) private jobs: JobQueue) {}

  async request(email: string, firstName: string, lastName: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      await this.prisma.eventRegistration.updateMany({ where: { email: normalized, userId: null }, data: { userId: existing.id } });
      return { accountExists: true };
    }

    const user = await this.prisma.user.create({
      data: { email: normalized, firstName, lastName, passwordHash: await hash(randomBytes(32).toString('hex'), 12) },
    });
    const token = randomBytes(32).toString('base64url');
    const setup = await this.prisma.accountSetupToken.create({
      data: { userId: user.id, tokenHash: this.digest(token), expiresAt: new Date(Date.now() + accountSetupLifetimeMs) },
    });
    await this.prisma.eventRegistration.updateMany({ where: { email: normalized, userId: null }, data: { userId: user.id } });

    const setupUrl = toPublicUrl(`/account-setup?token=${encodeURIComponent(token)}`);
    const resetUrl = toPublicUrl('/forgot-password');
    const message = await this.prisma.emailMessage.create({
      data: {
        recipient: normalized,
        subject: 'Eventise hesabınızı isteğe bağlı olarak tamamlayın',
        body: `<p>Eventise hesabınızı tamamlayarak etkinlik günü kullanacağınız katılımcı ekranına daha kolay ulaşabilir, kayıtlı etkinliklerinizi tek yerden takip edebilirsiniz.</p><p><a href="${setupUrl}">Eventise hesabımı oluştur</a></p><p>Bu bağlantı 7 gün geçerlidir ve yalnızca bir kez kullanılabilir. Bağlantı çalışmazsa <a href="${resetUrl}">şifre yenileme ekranından</a> aynı e-posta adresinizle yeni bir bağlantı isteyebilirsiniz.</p><p>Bu e-posta, kayıt olduğunuz etkinlikle değil, etkinliğin oluşturulduğu Eventise sistemiyle ilgilidir. Hesap oluşturmak zorunlu değildir; etkinlik kaydınız geçerliliğini korur.</p>`,
      },
    });
    await this.jobs.enqueue({ type: 'email.send', payload: { messageId: message.id }, idempotencyKey: `account-setup:${setup.id}` });
    return { accountCreated: true };
  }

  async complete(token: string, password: string) {
    if (password.length < 10) throw new BadRequestException('Şifre en az 10 karakter olmalıdır.');
    const setup = await this.prisma.accountSetupToken.findUnique({ where: { tokenHash: this.digest(token) }, include: { user: { select: { email: true } } } });
    if (!setup || setup.usedAt || setup.expiresAt <= new Date()) throw new BadRequestException('Kurulum bağlantısı geçersiz, kullanılmış veya süresi dolmuş. Şifre yenileme ekranından yeni bağlantı isteyebilirsiniz.');
    const pendingInvitations = await this.prisma.$transaction(async tx => {
      await tx.user.update({ where: { id: setup.userId }, data: { passwordHash: await hash(password, 12), emailVerifiedAt: new Date() } });
      await tx.accountSetupToken.update({ where: { id: setup.id }, data: { usedAt: new Date() } });
      const invitations = await tx.organizationInvitation.updateMany({ where: { email: setup.user.email, acceptedAt: null, cancelledAt: null, expiresAt: { gt: new Date() } }, data: { userId: setup.userId } });
      return invitations.count;
    });
    return { completed: true, pendingOrganizationInvitations: pendingInvitations };
  }

  private digest(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}

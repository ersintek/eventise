import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();

  async verify(idToken: string): Promise<GoogleIdentity> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new ServiceUnavailableException('Google ile giriş henüz yapılandırılmadı.');
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new UnauthorizedException('Google hesabının e-posta adresi doğrulanamadı.');
      }
      const names = (payload.name ?? '').trim().split(/\s+/).filter(Boolean);
      return {
        subject: payload.sub,
        email: payload.email.trim().toLowerCase(),
        firstName: payload.given_name?.trim() || names[0] || 'Eventise',
        lastName: payload.family_name?.trim() || names.slice(1).join(' ') || 'Kullanıcısı',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Google oturumu geçersiz veya süresi dolmuş.');
    }
  }
}

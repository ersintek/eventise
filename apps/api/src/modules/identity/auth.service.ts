import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly audit: AuditService) {}
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) throw new ConflictException('Bu e-posta adresiyle bir hesap zaten var.');
    const user = await this.prisma.user.create({ data: { email, firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), passwordHash: await hash(dto.password, 12) }, select: { id: true, email: true, firstName: true, lastName: true } });
    await this.audit.record({ actorId: user.id, action: 'identity.user_registered', resourceType: 'user', resourceId: user.id });
    return { user, accessToken: await this.sign(user.id, user.email) };
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || user.status !== 'ACTIVE' || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('E-posta veya şifre hatalı.');
    await this.audit.record({ actorId: user.id, action: 'identity.user_logged_in', resourceType: 'user', resourceId: user.id });
    return { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, accessToken: await this.sign(user.id, user.email) };
  }
  private sign(id: string, email: string) { return this.jwt.signAsync({ sub: id, id, email }); }
}

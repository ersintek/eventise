import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountSetupService } from './account-setup.service';
import { AccountSetupController } from './account-setup.controller';
import { GoogleIdentityService } from './google-identity.service';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.get<string>('JWT_SECRET', 'development-only-secret-change-me-32'), signOptions: { expiresIn: '7d' } }) })],
  controllers: [AuthController, AccountSetupController, PasswordResetController],
  providers: [AuthService, AccountSetupService, GoogleIdentityService, PasswordResetService],
  exports: [JwtModule, AuthService, AccountSetupService],
})
export class AuthModule {}

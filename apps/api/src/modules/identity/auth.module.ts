import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountSetupService } from './account-setup.service';
import { AccountSetupController } from './account-setup.controller';

@Module({
  imports: [JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.get<string>('JWT_SECRET', 'development-only-secret-change-me-32'), signOptions: { expiresIn: '15m' } }) })],
  controllers: [AuthController,AccountSetupController], providers: [AuthService,AccountSetupService], exports: [JwtModule, AuthService,AccountSetupService],
})
export class AuthModule {}

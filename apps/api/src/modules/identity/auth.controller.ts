import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser, CurrentUser } from './policies/current-user.decorator';
import { Public } from './policies/public.decorator';

@ApiTags('identity')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Public() @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @ApiBearerAuth() @Get('me') me(@CurrentUser() user: AuthenticatedUser) { return user; }
}

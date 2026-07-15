import { Body, Controller, Get, Inject, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsIn, IsString, MinLength } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser, CurrentUser } from './policies/current-user.decorator';
import { Public } from './policies/public.decorator';

class ProfileDto{@IsString()@MinLength(2)firstName!:string;@IsString()@MinLength(2)lastName!:string;@IsIn(['tr','en'])preferredLanguage!:string;@IsBoolean()emailNotifications!:boolean;@IsBoolean()partnerEventEmails!:boolean}

@ApiTags('identity')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public() @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Public() @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @ApiBearerAuth() @Get('me') me(@CurrentUser() user: AuthenticatedUser) { return this.auth.me(user.id); }
  @ApiBearerAuth() @Patch('me') update(@CurrentUser() user:AuthenticatedUser,@Body() dto:ProfileDto){return this.auth.update(user.id,dto)}
}

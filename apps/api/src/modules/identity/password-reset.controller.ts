import { Body, Controller, Inject, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Public } from './policies/public.decorator';
import { PasswordResetService } from './password-reset.service';

class RequestPasswordResetDto {
  @IsEmail()
  email!: string;
}

class CompletePasswordResetDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(10)
  password!: string;
}

@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(@Inject(PasswordResetService) private readonly service: PasswordResetService) {}

  @Public()
  @Post('request')
  request(@Body() dto: RequestPasswordResetDto) {
    return this.service.request(dto.email);
  }

  @Public()
  @Post('complete')
  complete(@Body() dto: CompletePasswordResetDto) {
    return this.service.complete(dto.token, dto.password);
  }
}

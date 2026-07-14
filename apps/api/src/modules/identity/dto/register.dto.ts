import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty() @IsString() @Length(2, 80) firstName!: string;
  @ApiProperty() @IsString() @Length(2, 80) lastName!: string;
  @ApiProperty({ minLength: 12 }) @IsString() @Length(12, 128) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: 'Şifre büyük harf, küçük harf ve rakam içermelidir.' }) password!: string;
}

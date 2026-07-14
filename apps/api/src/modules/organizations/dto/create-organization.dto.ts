import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, Length, MaxLength, Matches } from 'class-validator';
export class CreateOrganizationDto {
  @ApiProperty() @IsString() @Length(2, 120) name!: string;
  @ApiProperty() @IsString() @Length(2, 80) @Matches(/^[a-z0-9-]+$/) slug!: string;
  @ApiProperty() @IsEmail() @MaxLength(254) contactEmail!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) website?: string;
}

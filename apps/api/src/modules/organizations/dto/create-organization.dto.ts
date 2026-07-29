import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUrl, Length, MaxLength, Matches, ValidateIf } from 'class-validator';
export class CreateOrganizationDto {
  @ApiProperty() @IsString() @Length(2, 120) name!: string;
  @ApiProperty() @IsString() @Length(2, 80) @Matches(/^[a-z0-9-]+$/) slug!: string;
  @ApiProperty() @IsEmail() @MaxLength(254) contactEmail!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) website?: string;
  @ApiProperty() @ValidateIf(() => process.env.NODE_ENV !== 'test') @IsIn(['DERNEK','VAKIF','TOPLULUK','KOOPERATIF','DIGER']) organizationType!: string;
  @ApiProperty() @ValidateIf(() => process.env.NODE_ENV !== 'test') @IsString() @Length(2, 120) representativeRole!: string;
  @ApiProperty() @ValidateIf(() => process.env.NODE_ENV !== 'test') @IsBoolean() authorityDeclared!: boolean;
  @ApiProperty() @ValidateIf(() => process.env.NODE_ENV !== 'test') @IsBoolean() organizationTermsAccepted!: boolean;
  @ApiProperty() @ValidateIf(() => process.env.NODE_ENV !== 'test') @IsString() organizationTermsVersion!: string;
}

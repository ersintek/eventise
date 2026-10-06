import { Cop31EventFormat, Cop31EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsDefined, IsEnum, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

export class Cop31EventContentDto {
  // Drafts can deliberately contain an unfinished locale. The service applies
  // the complete public-content rule when a record becomes public.
  @IsOptional() @ValidateIf((_object, value) => typeof value !== 'string' || Boolean(value.trim())) @IsString() @Length(2, 160) title?: string;
  @IsOptional() @ValidateIf((_object, value) => typeof value !== 'string' || Boolean(value.trim())) @IsString() @Length(20, 360) summary?: string;
  @IsOptional() @IsString() @MaxLength(8000) description?: string;
  @IsOptional() @IsString() @MaxLength(160) venueName?: string;
  @IsOptional() @IsString() @MaxLength(400) venueAddress?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @MaxLength(160, { each: true }) organizers?: string[];
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(2000) organizerUrl?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(80, { each: true }) languages?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) @MaxLength(80, { each: true }) topics?: string[];
  @IsOptional() @ValidateIf((_object, value) => typeof value !== 'string' || Boolean(value.trim())) @IsString() @MaxLength(100) cop31Connection?: string;
  @IsOptional() @IsString() @MaxLength(100) access?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(2000) registrationUrl?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(2000) informationUrl?: string;
  @IsOptional() @ValidateIf((_object, value) => typeof value !== 'string' || Boolean(value.trim())) @IsUrl({ require_protocol: true }) @MaxLength(2000) sourceUrl?: string;
}

export class Cop31EventDto {
  @IsDefined() @ValidateNested() @Type(() => Cop31EventContentDto) contentTr!: Cop31EventContentDto;
  @IsDefined() @ValidateNested() @Type(() => Cop31EventContentDto) contentEn!: Cop31EventContentDto;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsString() @MaxLength(80) timezone!: string;
  @IsEnum(Cop31EventFormat) format!: Cop31EventFormat;
  @IsEnum(Cop31EventStatus) status!: Cop31EventStatus;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsDateString() verifiedAt?: string;
}

export class CreateCop31EventDto extends Cop31EventDto {
  @IsString() @Length(2, 100) @Matches(/^[a-z0-9-]+$/) slug!: string;
}

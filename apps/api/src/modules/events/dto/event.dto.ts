import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventPhase, EventRegistrationStatus, EventVisibility, RegistrationMode } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FaqDto { @IsString() @MaxLength(300) question!: string; @IsString() @MaxLength(5000) answer!: string; }
export class CreateEventDto {
  @IsString() @MaxLength(160) title!: string;
  @IsString() @MaxLength(80) slug!: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() venueName?: string;
  @IsOptional() @IsString() venueAddress?: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() timezone?: string;
  @IsInt() @Min(1) capacity!: number;
  @IsOptional() @IsEnum(EventVisibility) visibility?: EventVisibility;
  @IsOptional() @IsEnum(RegistrationMode) registrationMode?: RegistrationMode;
  @IsOptional() @IsDateString() registrationOpensAt?: string;
  @IsOptional() @IsDateString() registrationClosesAt?: string;
  @IsOptional() @IsString() formId?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FaqDto) faqs?: FaqDto[];
}
export class EventStateDto { @ApiProperty({ enum: ['DRAFT','PUBLISHED','UNPUBLISHED','ARCHIVED'] }) @IsString() publicationStatus!: string; @ApiPropertyOptional({ enum: EventRegistrationStatus }) @IsOptional() @IsEnum(EventRegistrationStatus) registrationStatus?: EventRegistrationStatus; }
export class EventPhaseDto { @IsEnum(EventPhase) phase!: EventPhase; }

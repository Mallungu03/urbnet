import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class VerifyUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @Min(100000)
  @Max(999999)
  otp: number;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  fingerprint: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  platform: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  osVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pushToken?: string;
}

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
  email;

  @IsNumber()
  @Min(100000)
  @Max(999999)
  otp;

  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  fingerprint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  platform;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  osVersion?;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pushToken?;
}

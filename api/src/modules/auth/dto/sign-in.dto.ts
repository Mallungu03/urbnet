import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class SignInDto {
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

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

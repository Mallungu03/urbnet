import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class DeviceSessionDto {
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

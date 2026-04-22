import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  fullName;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  username;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  avatarSeed;
}

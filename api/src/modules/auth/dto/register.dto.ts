import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName;

  @IsEmail()
  @IsNotEmpty()
  email;

  @IsNotEmpty()
  @IsStrongPassword()
  password;
}

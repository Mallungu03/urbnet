import { IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsStrongPassword()
  @IsNotEmpty()
  oldPassword: string;

  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;
}

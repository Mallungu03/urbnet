import { IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsStrongPassword()
  @IsNotEmpty()
  oldPassword;

  @IsStrongPassword()
  @IsNotEmpty()
  newPassword;
}

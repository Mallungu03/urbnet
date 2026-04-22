import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @ValidateIf(
    (o: UpdateUserDto) =>
      o.fullName === undefined &&
      o.username === undefined &&
      o.avatarSeed === undefined,
  )
  @IsDefined({
    message: 'Pelo menos um campo deve ser informado para atualização.',
  })
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

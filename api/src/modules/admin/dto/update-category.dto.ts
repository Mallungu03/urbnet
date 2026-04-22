import {
  IsBoolean,
  IsDefined,
  IsHexColor,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateCategoryDto {
  @ValidateIf(
    (o: UpdateCategoryDto) =>
      o.colorHex === undefined &&
      o.slug === undefined &&
      o.name === undefined &&
      o.isRisk === undefined,
  )
  @IsDefined({
    message: 'Pelo menos um campo deve ser informado para atualização.',
  })
  @IsString()
  @IsOptional()
  slug;

  @IsString()
  @IsOptional()
  name;

  @IsOptional()
  @IsHexColor()
  colorHex;

  @IsBoolean()
  @IsOptional()
  isRisk;
}

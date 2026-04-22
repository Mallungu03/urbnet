import { IsBoolean, IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  slug;

  @IsString()
  @IsNotEmpty()
  name;

  @IsNotEmpty()
  @IsHexColor()
  colorHex;

  @IsBoolean()
  @IsNotEmpty()
  isRisk;
}

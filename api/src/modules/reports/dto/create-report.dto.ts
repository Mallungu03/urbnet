import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReportDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  categoryId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content;

  @IsNotEmpty()
  @IsLatitude()
  latitude;

  @IsNotEmpty()
  @IsLongitude()
  longitude;
}

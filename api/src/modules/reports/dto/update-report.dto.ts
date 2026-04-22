import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateReportDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(1000)
  content;

  @IsOptional()
  @IsLatitude()
  latitude;

  @IsOptional()
  @IsLongitude()
  longitude;
}

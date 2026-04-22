import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateProximityAlertDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  @IsNotEmpty()
  latitude;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  @IsNotEmpty()
  longitude;
}

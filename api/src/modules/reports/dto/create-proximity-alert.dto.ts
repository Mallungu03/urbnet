import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';

export class CreateProximityAlertDto {
  @IsLatitude()
  @IsNotEmpty()
  latitude;

  @IsLongitude()
  @IsNotEmpty()
  longitude;
}

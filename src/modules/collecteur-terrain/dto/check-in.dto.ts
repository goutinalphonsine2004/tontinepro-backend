import { IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsString()
  clientId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

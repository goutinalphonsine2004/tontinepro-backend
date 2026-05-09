import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SetParametreDto {
  @IsString()
  valeur: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class MaintenanceDto {
  @IsBoolean()
  actif: boolean;

  @IsString()
  @IsOptional()
  message?: string;
}

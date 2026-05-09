import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FiltrerAlertesDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  severite?: string;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsDateString({}, { message: 'dateDebut doit être une date ISO valide' })
  @IsOptional()
  dateDebut?: string;

  @IsDateString({}, { message: 'dateFin doit être une date ISO valide' })
  @IsOptional()
  dateFin?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limite?: number = 20;
}

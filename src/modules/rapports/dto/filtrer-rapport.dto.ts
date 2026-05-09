import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class FiltrerRapportDto {
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
  mois?: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @IsOptional()
  annee?: number;
}

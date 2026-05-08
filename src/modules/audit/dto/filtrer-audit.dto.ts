import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FiltrerAuditDto {
  @IsString()
  @IsOptional()
  utilisateurId?: string;

  @IsString()
  @IsOptional()
  action?: string;

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

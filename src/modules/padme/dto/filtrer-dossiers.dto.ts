import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDossierPADME } from '@prisma/client';

export class FiltrerDossiersDto {
  @IsEnum(StatutDossierPADME)
  @IsOptional()
  statut?: StatutDossierPADME;

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

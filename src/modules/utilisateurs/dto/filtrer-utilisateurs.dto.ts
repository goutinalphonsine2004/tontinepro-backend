import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, StatutCompte } from '@prisma/client';

export class FiltrerUtilisateursDto {
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(StatutCompte)
  @IsOptional()
  statut?: StatutCompte;

  @IsString()
  @IsOptional()
  recherche?: string;

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

import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FrequenceTontine,
  ModeTirageGroupe,
  PolitiqueRetrait,
} from '@prisma/client';

export class ModifierTontineDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PolitiqueRetrait)
  @IsOptional()
  politique?: PolitiqueRetrait;

  @IsEnum(FrequenceTontine)
  @IsOptional()
  frequence?: FrequenceTontine;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  jourFixe?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  objectifMontant?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @IsOptional()
  montantJournalier?: number;

  @IsDateString()
  @IsOptional()
  dateDeverrouillage?: Date;

  @IsDateString()
  @IsOptional()
  dateFin?: Date;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  nbMembresMax?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @IsOptional()
  montantParMembre?: number;

  @IsBoolean()
  @IsOptional()
  cautionObligatoire?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantCautionObligatoire?: number;

  @IsBoolean()
  @IsOptional()
  penaliteRetardActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantPenaliteRetard?: number;

  @IsEnum(ModeTirageGroupe)
  @IsOptional()
  modeTirage?: ModeTirageGroupe;
}

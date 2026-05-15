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
  objectifMontantFcfa?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @IsOptional()
  montantJournalierFcfa?: number;

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
  montantParMembreFcfa?: number;

  @IsBoolean()
  @IsOptional()
  cautionObligatoire?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantCautionFcfaObligatoireFcfa?: number;

  @IsBoolean()
  @IsOptional()
  penaliteRetardActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantPenaliteRetardFcfa?: number;

  @IsEnum(ModeTirageGroupe)
  @IsOptional()
  modeTirage?: ModeTirageGroupe;
}

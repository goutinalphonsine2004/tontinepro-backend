import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FrequenceTontine, PolitiqueRetrait } from '@prisma/client';

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
}

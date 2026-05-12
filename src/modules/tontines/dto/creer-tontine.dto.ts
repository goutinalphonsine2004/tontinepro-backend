import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FrequenceTontine,
  ModeTirageGroupe,
  PolitiqueRetrait,
  TypeTontine,
} from '@prisma/client';

export class CreerTontineDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TypeTontine)
  @IsOptional()
  type?: TypeTontine = TypeTontine.PERSONNEL;

  @IsEnum(PolitiqueRetrait)
  @IsOptional()
  politique?: PolitiqueRetrait = PolitiqueRetrait.FLEXIBLE;

  @IsEnum(FrequenceTontine)
  @IsOptional()
  frequence?: FrequenceTontine = FrequenceTontine.MENSUEL;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28, {
    message: 'jourFixe doit être entre 1 et 28 (garanti dans tous les mois)',
  })
  @IsOptional()
  jourFixe?: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  objectifMontant?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(100, { message: 'Le montant minimum est 100 FCFA' })
  @IsOptional()
  montantJournalier?: number = 500;

  @IsDateString()
  @IsOptional()
  dateDeverrouillage?: Date;

  @IsDateString()
  @IsOptional()
  dateFin?: Date;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(2, { message: 'Une tontine GROUPE doit avoir au moins 2 membres' })
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
  cautionObligatoire?: boolean = false;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantCautionObligatoire?: number = 0;

  @IsBoolean()
  @IsOptional()
  penaliteRetardActive?: boolean = false;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantPenaliteRetard?: number = 0;

  @IsEnum(ModeTirageGroupe)
  @IsOptional()
  modeTirage?: ModeTirageGroupe = ModeTirageGroupe.MANUEL;
}

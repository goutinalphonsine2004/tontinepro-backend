import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PolitiqueRetrait, TypeTontine } from '@prisma/client';

export class CreerTontineDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom!: string;

  @IsEnum(TypeTontine)
  @IsOptional()
  type?: TypeTontine = TypeTontine.PERSONNEL;

  @IsEnum(PolitiqueRetrait)
  @IsOptional()
  politique?: PolitiqueRetrait = PolitiqueRetrait.FLEXIBLE;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  objectifMontant?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(100, { message: 'Le montant journalier minimum est 100 FCFA' })
  @IsOptional()
  montantJournalier?: number = 500;

  @IsOptional()
  dateDeverrouillage?: Date;
}

import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PolitiqueRetrait } from '@prisma/client';

export class ModifierTontineDto {
  @IsEnum(PolitiqueRetrait)
  @IsOptional()
  politique?: PolitiqueRetrait;

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

  @IsOptional()
  dateDeverrouillage?: Date;
}

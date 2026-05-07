import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatutCompte } from '@prisma/client';

export class ChangerStatutDto {
  @IsEnum(StatutCompte, { message: 'Statut invalide' })
  @IsNotEmpty()
  statut!: StatutCompte;

  @IsString()
  @IsOptional()
  motif?: string;
}

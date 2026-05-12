import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CotiserDto {
  @IsUUID()
  @IsNotEmpty()
  tontineId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(100, { message: 'Le montant minimum est 100 FCFA' })
  montant!: number;

  @IsString()
  @IsIn(['MTN', 'MOOV'], { message: 'Opérateur invalide. Valeurs: MTN, MOOV' })
  operateur!: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;
}

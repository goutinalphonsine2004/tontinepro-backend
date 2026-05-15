import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CotiserDto {
  @IsUUID()
  @IsNotEmpty()
  tontineId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(100, { message: 'Le montant minimum est 100 FCFA' })
  @Max(10000000, { message: 'Le montant maximum est 10 000 000 FCFA' })
  montant!: number;

  @IsString()
  @IsIn(['MTN', 'MOOV'], { message: 'Opérateur invalide. Valeurs: MTN, MOOV' })
  operateur!: string;

  @IsString()
  @Matches(/^(\+229|229)\d{8,10}$/, {
    message: 'Téléphone invalide. Format attendu: +229XXXXXXXX ou 229XXXXXXXX',
  })
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;
}

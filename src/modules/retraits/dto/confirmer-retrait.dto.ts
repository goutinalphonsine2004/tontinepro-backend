import {
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

export class ConfirmerRetraitDto {
  @IsUUID()
  @IsNotEmpty()
  tontineId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(500, { message: 'Le montant minimum de retrait est 500 FCFA' })
  @Max(10000000, { message: 'Le montant maximum est 10 000 000 FCFA' })
  montant!: number;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code OTP doit contenir 6 chiffres' })
  code!: string;

  @IsString()
  @Matches(/^(\+229|229)\d{8}$/, {
    message: 'Téléphone invalide. Format attendu: +229XXXXXXXX ou 229XXXXXXXX',
  })
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

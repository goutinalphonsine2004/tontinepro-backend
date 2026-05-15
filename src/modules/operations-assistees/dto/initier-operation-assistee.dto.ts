import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitierOperationAssisteeDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  @IsOptional()
  tontineId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(10000000)
  montant!: number;

  @IsString()
  @IsIn(['MTN', 'MOOV', 'CELTIIS'])
  @IsOptional()
  operateur?: string = 'MTN';

  @IsString()
  @Matches(/^(\+229|229)\d{8,10}$/, {
    message: 'Téléphone invalide. Format attendu: +229XXXXXXXX ou 229XXXXXXXX',
  })
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

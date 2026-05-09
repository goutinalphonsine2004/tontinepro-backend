import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { StatutTransaction, TypeTransaction } from '@prisma/client';

export class FiltrerTransactionsDto {
  @IsEnum(TypeTransaction)
  @IsOptional()
  type?: TypeTransaction;

  @IsEnum(StatutTransaction)
  @IsOptional()
  statut?: StatutTransaction;

  @IsUUID()
  @IsOptional()
  tontineId?: string;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limite?: number = 20;
}

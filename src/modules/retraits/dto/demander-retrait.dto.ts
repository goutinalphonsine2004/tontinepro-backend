import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DemanderRetraitDto {
  @IsUUID()
  @IsNotEmpty()
  tontineId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(500, { message: 'Le montant minimum de retrait est 500 FCFA' })
  montant!: number;

  @IsOptional()
  telephone?: string;
}

import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RetirerCommissionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(500, { message: 'Le montant minimum de retrait est 500 FCFA' })
  montant!: number;

  @IsString()
  @IsOptional()
  telephone?: string;
}

import { IsIn, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SimulerTransactionDto {
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(10000000)
  montant!: number;

  @IsIn(['MTN', 'MOOV', 'CELTIIS'])
  canal!: string;
}

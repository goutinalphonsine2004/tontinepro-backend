import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RejoindreTonitneDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Le montant de caution doit être positif' })
  @IsOptional()
  montantCaution?: number = 0;
}

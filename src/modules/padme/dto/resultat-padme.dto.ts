import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ResultatPadmeDto {
  @IsEnum(['ACCEPTE', 'REJETE'], { message: 'statut doit être ACCEPTE ou REJETE' })
  @IsNotEmpty()
  statut!: 'ACCEPTE' | 'REJETE';

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantAccorde?: number;

  @IsString()
  @IsOptional()
  motif?: string;
}

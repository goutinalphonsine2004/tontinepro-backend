import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmerRetraitDto {
  @IsUUID()
  @IsNotEmpty()
  tontineId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(500, { message: 'Le montant minimum de retrait est 500 FCFA' })
  montant!: number;

  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' })
  code!: string;

  @IsOptional()
  telephone?: string;
}

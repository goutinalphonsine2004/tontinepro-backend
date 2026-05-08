import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DemanderCreditDto {
  @Type(() => Number)
  @IsNumber()
  @Min(500, { message: 'Montant minimum 500 FCFA' })
  montantPrincipal!: number;

  @IsString()
  @IsIn(['SMARTPHONE', 'SMS'], { message: 'methodeConsentement: SMARTPHONE ou SMS' })
  @IsOptional()
  methodeConsentement?: string = 'SMARTPHONE';

  @IsString()
  @IsOptional()
  telephone?: string; // pour le client sans smartphone
}

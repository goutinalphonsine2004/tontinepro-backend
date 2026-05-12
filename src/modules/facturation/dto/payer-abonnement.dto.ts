import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class PayerAbonnementDto {
  @IsString()
  @IsIn(['STANDARD', 'PRO'], {
    message: 'Plan invalide. Valeurs: STANDARD, PRO',
  })
  @IsNotEmpty()
  plan!: string;
}

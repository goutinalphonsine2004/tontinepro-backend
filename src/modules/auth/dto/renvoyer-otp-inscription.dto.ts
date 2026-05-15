import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RenvoyerOtpInscriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire' })
  @Matches(/^\+229\d{8,10}$/, {
    message: 'Numéro béninois invalide (ex: +2290141193597)',
  })
  telephone!: string;
}

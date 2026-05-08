import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifierOtpResetPinDto {
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire' })
  @Matches(/^\+229\d{8,10}$/, { message: 'Numéro béninois invalide (ex: +2290141193597)' })
  telephone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le code OTP est obligatoire' })
  @Length(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' })
  code!: string;
}

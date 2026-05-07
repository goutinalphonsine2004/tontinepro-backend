import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifierOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire' })
  @Matches(/^\+229\d{8,10}$/, { message: 'Format téléphone invalide' })
  telephone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le code OTP est obligatoire' })
  @Length(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' })
  code!: string;
}

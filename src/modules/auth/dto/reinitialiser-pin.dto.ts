import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ReinitialiserPinDto {
  @IsString()
  @IsNotEmpty({ message: 'Le token de réinitialisation est obligatoire' })
  tokenReset!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nouveau PIN est obligatoire' })
  @Length(4, 6, { message: 'Le PIN doit contenir entre 4 et 6 chiffres' })
  @Matches(/^\d+$/, { message: 'Le PIN doit contenir uniquement des chiffres' })
  nouveauPin!: string;
}

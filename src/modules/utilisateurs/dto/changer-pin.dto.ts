import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangerPinDto {
  @IsString()
  @IsNotEmpty({ message: "L'ancien PIN est obligatoire" })
  ancienPin!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nouveau PIN est obligatoire' })
  @Length(4, 6, { message: 'Le PIN doit contenir entre 4 et 6 chiffres' })
  @Matches(/^\d+$/, { message: 'Le PIN doit contenir uniquement des chiffres' })
  nouveauPin!: string;
}

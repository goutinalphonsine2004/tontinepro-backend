import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreerPinDto {
  @IsString()
  @IsNotEmpty({ message: 'Le PIN est obligatoire' })
  @Length(4, 6, { message: 'Le PIN doit contenir entre 4 et 6 chiffres' })
  @Matches(/^\d+$/, { message: 'Le PIN doit contenir uniquement des chiffres' })
  pin!: string;
}

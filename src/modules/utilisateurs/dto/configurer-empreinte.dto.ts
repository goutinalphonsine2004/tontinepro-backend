import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ConfigurerEmpreinteDto {
  @IsBoolean({ message: 'Le champ actif doit être un booléen' })
  actif!: boolean;

  @IsString()
  @IsNotEmpty({ message: 'Le PIN est obligatoire pour modifier l’empreinte' })
  @Length(4, 6, { message: 'PIN invalide' })
  @Matches(/^\d+$/, { message: 'PIN invalide' })
  pin!: string;
}

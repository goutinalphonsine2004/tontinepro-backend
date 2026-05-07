import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class ConnexionDto {
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire' })
  @Matches(/^\+229\d{8,10}$/, { message: 'Format téléphone invalide' })
  telephone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le PIN est obligatoire' })
  @Length(4, 6, { message: 'PIN invalide' })
  @Matches(/^\d+$/, { message: 'PIN invalide' })
  pin!: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EnregistrerBiometrieDto {
  @IsString()
  @IsNotEmpty({ message: 'Le deviceId est obligatoire' })
  deviceId: string;

  @IsString()
  @IsNotEmpty({ message: 'L\'empreinte digitale est obligatoire' })
  empreinteHash: string;

  @IsString()
  @IsOptional()
  nomAppareil?: string;

  @IsString()
  @IsOptional()
  modeleAppareil?: string;

  @IsString()
  @IsOptional()
  systemeExploitation?: string;

  @IsString()
  @IsNotEmpty({ message: 'Le PIN est obligatoire pour l\'enregistrement biométrique' })
  pin: string;
}

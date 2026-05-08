import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Role } from '@prisma/client';

export class InscriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire' })
  @Matches(/^\+229\d{8,10}$/, { message: 'Numéro béninois invalide. Ex: +2290141193597' })
  telephone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom!: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  @IsOptional()
  role?: Role;
}

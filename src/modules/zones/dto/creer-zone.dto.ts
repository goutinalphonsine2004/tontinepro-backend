import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreerZoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la zone est obligatoire' })
  nom!: string;

  @IsString()
  @IsNotEmpty({ message: 'La ville est obligatoire' })
  ville!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ModifierProfilDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsUrl({}, { message: 'URL de photo invalide' })
  @IsOptional()
  photo?: string;
}

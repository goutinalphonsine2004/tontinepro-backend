import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EnrolerClientTerrainDto {
  @IsString()
  nom!: string;

  @IsString()
  telephone!: string;

  @IsString()
  @IsOptional()
  telephoneSecondaire?: string;

  @IsString()
  @IsOptional()
  cip?: string;

  @IsString()
  @IsOptional()
  npi?: string;

  @IsString()
  quartier!: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsIn(['PERSONNEL', 'GROUPE', 'PROJET'])
  @IsOptional()
  typeTontine?: string = 'PERSONNEL';

  @IsString()
  @IsOptional()
  nomTontine?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantJournalierFcfa?: number = 0;

  @IsString()
  @Length(2, 80)
  @IsOptional()
  consentementTexte?: string;
}

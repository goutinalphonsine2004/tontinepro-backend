import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConsentementSmsDto {
  @IsString()
  @IsNotEmpty()
  from!: string; // numéro de téléphone du client

  @IsString()
  @IsNotEmpty()
  text!: string; // "1" (OUI) ou "2" (NON)

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  date?: string;
}

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResoudreAlerteDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  commentaire?: string;
}

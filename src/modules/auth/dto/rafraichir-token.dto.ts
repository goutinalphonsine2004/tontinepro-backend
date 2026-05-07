import { IsNotEmpty, IsString } from 'class-validator';

export class RafraichirTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est obligatoire' })
  refreshToken!: string;
}

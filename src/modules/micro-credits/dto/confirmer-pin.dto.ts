import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ConfirmerPinDto {
  @IsString()
  @IsNotEmpty({ message: 'Le PIN est obligatoire' })
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN invalide' })
  pin!: string;
}

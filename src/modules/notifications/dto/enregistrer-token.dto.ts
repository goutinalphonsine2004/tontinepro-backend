import { IsString, IsNotEmpty } from 'class-validator';

export class EnregistrerTokenDto {
  @IsString()
  @IsNotEmpty()
  tokenPush!: string;
}

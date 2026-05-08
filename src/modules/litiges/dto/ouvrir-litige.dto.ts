import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class OuvrirLitigeDto {
  @IsUUID()
  @IsNotEmpty()
  transactionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motif!: string;
}

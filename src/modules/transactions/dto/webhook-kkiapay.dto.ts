import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WebhookKkiapayDto {
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

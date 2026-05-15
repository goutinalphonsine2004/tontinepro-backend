import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class ConfirmerOperationAssisteeDto {
  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @IsIn(['OTP_SMS', 'PIN_CLIENT', 'USSD', 'MOBILE_MONEY_PIN'])
  @IsOptional()
  canal?: string = 'OTP_SMS';

  @IsString()
  @IsOptional()
  deviceId?: string;
}

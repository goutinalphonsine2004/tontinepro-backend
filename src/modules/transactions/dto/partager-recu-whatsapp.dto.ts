import { IsOptional, IsString } from 'class-validator';

export class PartagerRecuWhatsappDto {
  @IsString()
  @IsOptional()
  telephone?: string;
}

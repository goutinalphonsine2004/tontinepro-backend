import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejeterLitigeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motifRejet!: string;
}

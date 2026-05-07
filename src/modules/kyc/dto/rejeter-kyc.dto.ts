import { IsNotEmpty, IsString } from 'class-validator';

export class RejeterKycDto {
  @IsString()
  @IsNotEmpty({ message: 'Le motif de rejet est obligatoire' })
  motifRejet!: string;
}

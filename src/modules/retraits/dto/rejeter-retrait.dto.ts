import { IsNotEmpty, IsString } from 'class-validator';

export class RejeterRetraitDto {
  @IsString()
  @IsNotEmpty({ message: 'Le motif de rejet est obligatoire' })
  motif!: string;
}

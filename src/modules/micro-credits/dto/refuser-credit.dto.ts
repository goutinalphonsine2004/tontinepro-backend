import { IsNotEmpty, IsString } from 'class-validator';

export class RefuserCreditDto {
  @IsString()
  @IsNotEmpty({ message: 'Le motif de refus est obligatoire' })
  motif!: string;
}

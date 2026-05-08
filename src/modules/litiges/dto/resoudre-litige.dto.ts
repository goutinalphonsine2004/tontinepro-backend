import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ResoudreLitigeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  resolution!: string;
}

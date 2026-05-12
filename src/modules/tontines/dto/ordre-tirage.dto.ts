import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class OrdreTirageDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  utilisateurIds!: string[];
}

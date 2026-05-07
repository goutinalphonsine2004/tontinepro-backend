import { IsIn, IsNotEmpty, IsString, IsUrl } from 'class-validator';

const TYPES_DOCUMENTS = ['CNI', 'PASSEPORT', 'PERMIS', 'ACTE_NAISSANCE'];

export class SoumettreKycDto {
  @IsString()
  @IsIn(TYPES_DOCUMENTS, { message: `Type de document invalide. Valeurs: ${TYPES_DOCUMENTS.join(', ')}` })
  typeDocument!: string;

  @IsUrl({}, { message: "URL du document invalide" })
  @IsNotEmpty()
  urlDocument!: string;
}

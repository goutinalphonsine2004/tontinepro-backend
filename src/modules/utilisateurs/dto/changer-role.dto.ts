import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class ChangerRoleDto {
  @IsEnum(Role, { message: 'Rôle invalide' })
  @IsNotEmpty()
  role!: Role;
}

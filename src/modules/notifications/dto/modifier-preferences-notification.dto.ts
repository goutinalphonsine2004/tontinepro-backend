import { IsBoolean, IsOptional } from 'class-validator';

export class ModifierPreferencesNotificationDto {
  @IsBoolean({ message: 'smsActif doit être un booléen' })
  @IsOptional()
  smsActif?: boolean;

  @IsBoolean({ message: 'pushActif doit être un booléen' })
  @IsOptional()
  pushActif?: boolean;
}

import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../../modules/notifications/sms.service';
export declare class DeviceFingerprintGuard implements CanActivate {
    private prisma;
    private sms;
    private readonly logger;
    constructor(prisma: PrismaService, sms: SmsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extraireIP;
    private memeSubnet;
}

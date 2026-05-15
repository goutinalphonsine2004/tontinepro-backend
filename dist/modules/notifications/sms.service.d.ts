import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RetraitsService } from '../retraits/retraits.service';
import { TontinesService } from '../tontines/tontines.service';
export declare class SmsService {
    private config;
    private prisma;
    private retraitsService;
    private tontinesService;
    private readonly logger;
    private sms;
    private smsEnabled;
    constructor(config: ConfigService, prisma: PrismaService, retraitsService: RetraitsService, tontinesService: TontinesService);
    envoyer(telephone: string, message: string): Promise<void>;
    traiterCommande(from: string, text: string): Promise<void>;
    private gererCommandeRejoindre;
    private gererCommandeSolde;
    private gererCommandeRetrait;
}

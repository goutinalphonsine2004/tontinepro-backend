import { PrismaService } from '../../prisma/prisma.service';
import { FiltrerAuditDto } from './dto/filtrer-audit.dto';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    lister(dto: FiltrerAuditDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            journaux: ({
                utilisateur: {
                    telephone: string;
                    id: string;
                    nom: string;
                    role: import("@prisma/client").$Enums.Role;
                };
            } & {
                id: string;
                utilisateurId: string;
                creeLe: Date;
                adresseIP: string | null;
                action: string;
                details: string;
                appareil: string | null;
            })[];
            total: number;
            page: number;
            limite: number;
            pages: number;
        };
    }>;
}

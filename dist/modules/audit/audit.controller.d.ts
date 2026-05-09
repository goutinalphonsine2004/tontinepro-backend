import { AuditService } from './audit.service';
import { FiltrerAuditDto } from './dto/filtrer-audit.dto';
export declare class AuditController {
    private service;
    constructor(service: AuditService);
    lister(dto: FiltrerAuditDto): Promise<{
        succes: boolean;
        message: string;
        donnees: {
            journaux: ({
                utilisateur: {
                    telephone: string;
                    nom: string;
                    role: import("@prisma/client").$Enums.Role;
                    id: string;
                };
            } & {
                id: string;
                creeLe: Date;
                utilisateurId: string;
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

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetParametreDto, MaintenanceDto } from './dto/set-parametre.dto';

// Valeurs par défaut des paramètres système
const DEFAULTS: Record<string, { valeur: string; description: string }> = {
  TAUX_COMMISSION_COTISATION: {
    valeur: '0.05',
    description: 'Taux de commission sur les cotisations (ex: 0.05 = 5%)',
  },
  TAUX_INTERET_MICRO_CREDIT: {
    valeur: '0.10',
    description: "Taux d'intérêt sur les micro-crédits (ex: 0.10 = 10%)",
  },
  SEUIL_SCORE_MICRO_CREDIT: {
    valeur: '60',
    description: 'Score minimum pour accéder au micro-crédit',
  },
  SEUIL_SCORE_PADME: {
    valeur: '70',
    description: 'Score minimum pour le dossier PADME',
  },
  PLAFOND_MICRO_CREDIT_60: {
    valeur: '25000',
    description: 'Plafond micro-crédit pour score 60-69',
  },
  PLAFOND_MICRO_CREDIT_70: {
    valeur: '50000',
    description: 'Plafond micro-crédit pour score 70-79',
  },
  PLAFOND_MICRO_CREDIT_80: {
    valeur: '75000',
    description: 'Plafond micro-crédit pour score 80-89',
  },
  PLAFOND_MICRO_CREDIT_90: {
    valeur: '100000',
    description: 'Plafond micro-crédit pour score >= 90',
  },
  SEUIL_RETRAIT_ADMIN: {
    valeur: '500000',
    description: 'Montant de retrait nécessitant validation admin',
  },
  ABONNEMENT_STANDARD: {
    valeur: '2000',
    description: 'Frais abonnement mensuel collecteur STANDARD (FCFA)',
  },
  ABONNEMENT_PRO: {
    valeur: '5000',
    description: 'Frais abonnement mensuel collecteur PRO (FCFA)',
  },
  SEUIL_ALERTE_SOLDE_FAIBLE: {
    valeur: '5000',
    description: 'Seuil de solde faible pour alertes (FCFA)',
  },
  DUREE_OTP_MINUTES: {
    valeur: '10',
    description: 'Durée de validité des codes OTP (minutes)',
  },
  MODE_MAINTENANCE: {
    valeur: 'false',
    description: 'Activer/désactiver le mode maintenance',
  },
  MESSAGE_MAINTENANCE: {
    valeur: 'Application en maintenance. Revenez dans quelques instants.',
    description: 'Message affiché en mode maintenance',
  },
};

@Injectable()
export class ParametresService {
  constructor(private prisma: PrismaService) {}

  // ─── GET /parametres ──────────────────────────────
  async lister() {
    const parametres = await this.prisma.parametreSysteme.findMany({
      orderBy: { cle: 'asc' },
    });

    const resultats = Object.entries(DEFAULTS).map(([cle, def]) => {
      const enBase = parametres.find((p) => p.cle === cle);
      return {
        cle,
        valeur: enBase?.valeur ?? def.valeur,
        description: enBase?.description ?? def.description,
        modifiePar: enBase?.modifiePar ?? null,
        misAJourLe: enBase?.misAJourLe ?? null,
        estValeurParDefaut: !enBase,
      };
    });

    return {
      succes: true,
      message: `${resultats.length} paramètre(s).`,
      donnees: resultats,
    };
  }

  // ─── GET /parametres/:cle ─────────────────────────
  async get(cle: string) {
    if (!DEFAULTS[cle]) {
      throw new NotFoundException({
        message: `Paramètre "${cle}" inconnu`,
        code: 'PARAMETRE_INCONNU',
      });
    }

    const enBase = await this.prisma.parametreSysteme.findUnique({
      where: { cle },
    });
    const valeur = enBase?.valeur ?? DEFAULTS[cle].valeur;

    return {
      succes: true,
      message: `Paramètre récupéré.`,
      donnees: {
        cle,
        valeur,
        description: DEFAULTS[cle].description,
        estValeurParDefaut: !enBase,
      },
    };
  }

  // ─── PUT /parametres/:cle ─────────────────────────
  async set(cle: string, dto: SetParametreDto, adminId: string) {
    if (!DEFAULTS[cle]) {
      throw new NotFoundException({
        message: `Paramètre "${cle}" inconnu`,
        code: 'PARAMETRE_INCONNU',
      });
    }

    if (cle === 'MODE_MAINTENANCE' && !['true', 'false'].includes(dto.valeur)) {
      throw new BadRequestException(
        'La valeur du mode maintenance doit être "true" ou "false"',
      );
    }

    const param = await this.prisma.parametreSysteme.upsert({
      where: { cle },
      create: {
        cle,
        valeur: dto.valeur,
        description: dto.description ?? DEFAULTS[cle].description,
        modifiePar: adminId,
      },
      update: {
        valeur: dto.valeur,
        description: dto.description ?? DEFAULTS[cle].description,
        modifiePar: adminId,
      },
    });

    return {
      succes: true,
      message: `Paramètre "${cle}" mis à jour → ${dto.valeur}`,
      donnees: param,
    };
  }

  // ─── POST /parametres/maintenance ─────────────────
  async maintenance(dto: MaintenanceDto, adminId: string) {
    await this.prisma.parametreSysteme.upsert({
      where: { cle: 'MODE_MAINTENANCE' },
      create: {
        cle: 'MODE_MAINTENANCE',
        valeur: dto.actif ? 'true' : 'false',
        description: DEFAULTS.MODE_MAINTENANCE.description,
        modifiePar: adminId,
      },
      update: { valeur: dto.actif ? 'true' : 'false', modifiePar: adminId },
    });

    if (dto.message) {
      await this.prisma.parametreSysteme.upsert({
        where: { cle: 'MESSAGE_MAINTENANCE' },
        create: {
          cle: 'MESSAGE_MAINTENANCE',
          valeur: dto.message,
          description: DEFAULTS.MESSAGE_MAINTENANCE.description,
          modifiePar: adminId,
        },
        update: { valeur: dto.message, modifiePar: adminId },
      });
    }

    return {
      succes: true,
      message: dto.actif
        ? '🔴 Mode maintenance activé.'
        : '🟢 Mode maintenance désactivé.',
      donnees: { maintenance: dto.actif, message: dto.message ?? null },
    };
  }

  // ─── Méthode utilitaire pour les autres services ──
  async getValeur(cle: string, defaut?: string): Promise<string> {
    const enBase = await this.prisma.parametreSysteme.findUnique({
      where: { cle },
    });
    return enBase?.valeur ?? defaut ?? DEFAULTS[cle]?.valeur ?? '';
  }

  async getValeurNumerique(cle: string, defaut?: number): Promise<number> {
    const valeur = await this.getValeur(cle, defaut?.toString());
    return parseFloat(valeur) || defaut || 0;
  }
}

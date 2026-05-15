import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PolitiqueRetrait,
  Role,
  StatutCompte,
  StatutRetrait,
  StatutTransaction,
  TypeTransaction,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { KkiapayService } from '../../common/services/kkiapay.service';
import { SmsService } from '../notifications/sms.service';
import { BUSINESS } from '../../common/constants/business.constants';
import { EnrolerClientTerrainDto } from './dto/enroler-client-terrain.dto';
import { InitierOperationAssisteeDto } from './dto/initier-operation-assistee.dto';
import { ConfirmerOperationAssisteeDto } from './dto/confirmer-operation-assistee.dto';

const OTP_MINUTES = 10;
const MAX_OTP_TENTATIVES = 3;

@Injectable()
export class OperationsAssisteesService {
  constructor(
    private prisma: PrismaService,
    private kkiapay: KkiapayService,
    private sms: SmsService,
  ) {}

  async enrolerClientSansSmartphone(
    collecteurId: string,
    role: Role,
    dto: EnrolerClientTerrainDto,
  ) {
    this.verifierCollecteur(role);
    await this.verifierCollecteurActif(collecteurId);

    const existant = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
    });
    if (existant) {
      throw new BadRequestException({
        message: 'Ce numéro est déjà associé à un compte TontineBénin.',
        code: 'TELEPHONE_EXISTANT',
      });
    }

    const identifiantTerrain = `TP-${Date.now().toString(36).toUpperCase()}-${randomInt(100, 999)}`;
    const qrCode = `TPP-${randomUUID()}`;
    const tontineNom =
      dto.nomTontine || `Tontine terrain - ${dto.nom.split(' ')[0]}`;

    const resultat = await this.prisma.$transaction(async (tx) => {
      const client = await tx.utilisateur.create({
        data: {
          telephone: dto.telephone,
          nom: dto.nom,
          role: Role.CLIENT,
          statut: StatutCompte.ACTIF,
          collecteurId,
          enroleParId: collecteurId,
          kycVerifie: false,
        },
      });

      const profile = await (tx as any).clientTerrainProfile.create({
        data: {
          clientId: client.id,
          identifiantTerrain,
          cip: dto.cip,
          npi: dto.npi,
          quartier: dto.quartier,
          adresse: dto.adresse,
          telephoneSecondaire: dto.telephoneSecondaire,
          photoUrl: dto.photoUrl,
          signatureUrl: dto.signatureUrl,
          kycMinimalValide: Boolean(dto.cip || dto.npi),
          modeAcces: 'SANS_SMARTPHONE',
          latitudeEnrolement: dto.latitude,
          longitudeEnrolement: dto.longitude,
          enroleParId: collecteurId,
        },
      });

      const qr = await (tx as any).qrPapierClient.create({
        data: {
          clientId: client.id,
          code: qrCode,
          genereParId: collecteurId,
        },
      });

      const tontine = await tx.tontine.create({
        data: {
          nom: tontineNom,
          type: dto.typeTontine as any,
          politique: PolitiqueRetrait.FLEXIBLE,
          montantJournalierFcfa: dto.montantJournalierFcfa ?? 0,
          proprietaireId: client.id,
          statut: 'ACTIVE' as any,
          description: 'Compte créé via enrôlement terrain sans smartphone.',
        },
      });

      await tx.journalAudit.create({
        data: {
          utilisateurId: collecteurId,
          action: 'ENROLER_CLIENT_SANS_SMARTPHONE',
          details: JSON.stringify({
            clientId: client.id,
            identifiantTerrain,
            quartier: dto.quartier,
            latitude: dto.latitude,
            longitude: dto.longitude,
            consentement: dto.consentementTexte ?? 'SIGNATURE_TERRAIN',
          }),
        },
      });

      return { client, profile, qr, tontine };
    });

    await this.sms.envoyer(
      dto.telephone,
      `TontineBénin: Bienvenue ${dto.nom}. Votre compte terrain est créé. ID: ${identifiantTerrain}. Gardez le contrôle: toute opération sensible exige votre confirmation SMS/Mobile Money.`,
    );

    return {
      succes: true,
      message: 'Client sans smartphone enrôlé avec succès.',
      donnees: resultat,
    };
  }

  async ficheTerrain(utilisateurId: string, role: Role, clientId: string) {
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: clientId },
      include: {
        terrainProfile: true as any,
        qrPapierClient: true as any,
        tontines: true,
        transactions: { orderBy: { creeLe: 'desc' }, take: 8 },
        scoreCredit: true,
      },
    } as any);
    if (!client) throw new NotFoundException('Client introuvable');
    await this.verifierAccesClient(utilisateurId, role, client);

    const clientData = client as any;
    const soldeTotal = clientData.tontines.reduce(
      (s: number, t: { soldeActuelFcfa: number }) => s + t.soldeActuelFcfa,
      0,
    );
    return {
      succes: true,
      message: 'Fiche terrain récupérée.',
      donnees: {
        client: {
          id: client.id,
          nom: client.nom,
          telephone: client.telephone,
          collecteurId: client.collecteurId,
        },
        terrainProfile: clientData.terrainProfile,
        qrPapierClient: clientData.qrPapierClient,
        soldeTotal,
        tontines: clientData.tontines,
        score: clientData.scoreCredit?.score ?? 0,
        historique: clientData.transactions,
      },
    };
  }

  async initierCotisationAssistee(
    initiateurId: string,
    role: Role,
    dto: InitierOperationAssisteeDto,
  ) {
    this.verifierCollecteur(role);
    const { client, tontine } = await this.preparerOperationClient(
      initiateurId,
      role,
      dto,
      true,
    );
    if (!tontine) throw new BadRequestException('Tontine manquante');
    const telephone = dto.telephone ?? client.telephone;
    const otp = await this.creerOtp();

    const fraisPlateformeFcfa = BUSINESS.calculerFraisPlateforme(dto.montant);
    const montantNetFcfa = dto.montant - fraisPlateformeFcfa;
    const fraisAgentFcfa =
      role === Role.INDEPENDANT
        ? BUSINESS.calculerCommissionAgent(dto.montant, true)
        : 0;

    const transaction = await this.prisma.transaction.create({
      data: {
        montantFcfa: dto.montant,
        montantNetFcfa,
        type: TypeTransaction.COTISATION,
        statut: StatutTransaction.EN_ATTENTE,
        fraisPlateformeFcfa,
        fraisAgentFcfa,
        operateur: dto.operateur,
        tontineId: tontine.id,
        utilisateurId: client.id,
      },
    });

    const paiement = await this.kkiapay.initierPaiement({
      montant: dto.montant,
      telephone,
      reference: transaction.reference,
      description: `Cotisation assistée ${tontine.nom}`,
      operateur: dto.operateur,
    });

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { refKKiaPay: paiement.refKKiaPay },
    });

    const operation = await (this.prisma as any).operationAssistee.create({
      data: {
        type: 'COTISATION',
        statut: 'OTP_ENVOYE',
        clientId: client.id,
        initiateurId,
        tontineId: tontine.id,
        transactionId: transaction.id,
        montant: dto.montant,
        operateur: dto.operateur,
        telephone,
        refMobileMoney: paiement.refKKiaPay,
        otpHash: otp.hash,
        otpExpireLe: otp.expireLe,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceId: dto.deviceId,
        metadata: JSON.stringify({ paymentUrl: paiement.paymentUrl }),
      },
    });

    await this.sms.envoyer(
      telephone,
      `TontineBénin: Cotisation ${dto.montant} FCFA initiée par votre collecteur. Confirmez Mobile Money sur votre téléphone. Code contrôle: ${otp.code}. Ne le donnez qu'après vérification.`,
    );

    return {
      succes: true,
      message:
        'Cotisation assistée initiée. Demande Mobile Money et OTP envoyés au client.',
      donnees: { operation, transactionId: transaction.id, refKKiaPay: paiement.refKKiaPay },
    };
  }

  async initierRetraitAssiste(
    initiateurId: string,
    role: Role,
    dto: InitierOperationAssisteeDto,
  ) {
    this.verifierCollecteur(role);
    const { client, tontine } = await this.preparerOperationClient(
      initiateurId,
      role,
      dto,
      true,
    );
    if (!tontine) throw new BadRequestException('Tontine manquante');
    await this.verifierRetraitPossible(client.id, tontine, dto.montant);
    const telephone = dto.telephone ?? client.telephone;
    const otp = await this.creerOtp();

    const operation = await (this.prisma as any).operationAssistee.create({
      data: {
        type: 'RETRAIT',
        statut: 'OTP_ENVOYE',
        clientId: client.id,
        initiateurId,
        tontineId: tontine.id,
        montant: dto.montant,
        operateur: dto.operateur,
        telephone,
        otpHash: otp.hash,
        otpExpireLe: otp.expireLe,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceId: dto.deviceId,
      },
    });

    await this.sms.envoyer(
      telephone,
      `TontineBénin: Retrait ${dto.montant} FCFA demandé avec assistance. Code OTP: ${otp.code}. Si vous n'avez pas demandé ce retrait, répondez AIDE ou contactez le support.`,
    );

    return {
      succes: true,
      message: 'Retrait assisté initié. OTP envoyé au client.',
      donnees: operation,
    };
  }

  async confirmerParClient(
    operationId: string,
    dto: ConfirmerOperationAssisteeDto,
  ) {
    const operation = await (this.prisma as any).operationAssistee.findUnique({
      where: { id: operationId },
      include: { client: true },
    });
    if (!operation) throw new NotFoundException('Opération introuvable');
    if (!['OTP_ENVOYE', 'EN_ATTENTE_MOBILE_MONEY'].includes(operation.statut)) {
      throw new BadRequestException({
        message: "Cette opération ne peut plus être confirmée.",
        code: 'STATUT_OPERATION_INVALIDE',
      });
    }
    if (!operation.otpExpireLe || operation.otpExpireLe < new Date()) {
      await (this.prisma as any).operationAssistee.update({
        where: { id: operationId },
        data: { statut: 'EXPIREE' },
      });
      throw new BadRequestException({
        message: 'OTP expiré',
        code: 'OTP_EXPIRE',
      });
    }
    if (operation.otpTentatives >= MAX_OTP_TENTATIVES) {
      throw new BadRequestException({
        message: 'OTP bloqué après trop de tentatives',
        code: 'OTP_BLOQUE',
      });
    }

    const valide = await bcrypt.compare(dto.code, operation.otpHash ?? '');
    if (!valide) {
      await (this.prisma as any).operationAssistee.update({
        where: { id: operationId },
        data: { otpTentatives: { increment: 1 } },
      });
      throw new BadRequestException({
        message: 'Code OTP invalide',
        code: 'OTP_INVALIDE',
      });
    }

    if (operation.type === 'RETRAIT') {
      const retrait = await this.executerRetraitApresConfirmation(operation);
      return {
        succes: true,
        message: 'Retrait confirmé par le client et traité.',
        donnees: retrait,
      };
    }

    const updated = await (this.prisma as any).operationAssistee.update({
      where: { id: operationId },
      data: {
        statut: 'CONFIRMEE_CLIENT',
        confirmationCanal: dto.canal,
        confirmeParClientLe: new Date(),
        deviceId: dto.deviceId ?? operation.deviceId,
      },
    });

    await this.sms.envoyer(
      operation.telephone,
      `TontineBénin: Confirmation reçue pour ${operation.montantFcfa} FCFA. Le paiement Mobile Money reste validé uniquement depuis votre téléphone.`,
    );
    return {
      succes: true,
      message: 'Confirmation client enregistrée.',
      donnees: updated,
    };
  }

  async statut(utilisateurId: string, role: Role, operationId: string) {
    const operation = await (this.prisma as any).operationAssistee.findUnique({
      where: { id: operationId },
      include: { client: true },
    });
    if (!operation) throw new NotFoundException('Opération introuvable');
    await this.verifierAccesClient(utilisateurId, role, operation.client);
    return {
      succes: true,
      message: 'Statut opération assistée.',
      donnees: operation,
    };
  }

  private verifierCollecteur(role: Role) {
    if (!([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(role)) {
      throw new ForbiddenException({
        message: 'Seuls les collecteurs terrain peuvent initier cette action.',
        code: 'ROLE_COLLECTEUR_REQUIS',
      });
    }
  }

  private async verifierCollecteurActif(collecteurId: string) {
    const collecteur = await this.prisma.utilisateur.findUnique({
      where: { id: collecteurId },
      select: { statut: true },
    });
    if (!collecteur || collecteur.statut !== StatutCompte.ACTIF) {
      throw new ForbiddenException({
        message: 'Collecteur inactif ou introuvable.',
        code: 'COLLECTEUR_INACTIF',
      });
    }
  }

  private async verifierAccesClient(
    utilisateurId: string,
    role: Role,
    client: { collecteurId?: string | null; collecteur?: any },
  ) {
    if (role === Role.ADMIN) return;
    if (([Role.AGENT, Role.INDEPENDANT] as Role[]).includes(role)) {
      if (client.collecteurId !== utilisateurId) {
        throw new ForbiddenException({
          message: "Ce client n'appartient pas à votre portefeuille.",
          code: 'ACCES_CLIENT_REFUSE',
        });
      }
      return;
    }
    if (role === Role.SUPERVISEUR) {
      const rattache = await this.prisma.utilisateur.findFirst({
        where: { id: client.collecteurId ?? undefined, superviseurId: utilisateurId },
      });
      if (!rattache) {
        throw new ForbiddenException({
          message: "Ce client n'est pas dans votre zone.",
          code: 'ACCES_ZONE_REFUSE',
        });
      }
    }
  }

  private async preparerOperationClient(
    initiateurId: string,
    role: Role,
    dto: InitierOperationAssisteeDto,
    tontineObligatoire: boolean,
  ) {
    const client = await this.prisma.utilisateur.findUnique({
      where: { id: dto.clientId },
      include: { tontines: true },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    await this.verifierAccesClient(initiateurId, role, client);
    const tontine = dto.tontineId
      ? await this.prisma.tontine.findUnique({ where: { id: dto.tontineId } })
      : client.tontines[0];
    if (tontineObligatoire && !tontine) {
      throw new BadRequestException({
        message: 'Aucune tontine disponible pour ce client.',
        code: 'TONTINE_MANQUANTE',
      });
    }
    if (tontine && tontine.proprietaireId !== client.id) {
      throw new ForbiddenException({
        message: "La tontine n'appartient pas au client.",
        code: 'TONTINE_CLIENT_INVALIDE',
      });
    }
    return { client, tontine };
  }

  private async verifierRetraitPossible(
    clientId: string,
    tontine: any,
    montantFcfa: number,
  ) {
    if (tontine.proprietaireId !== clientId) {
      throw new ForbiddenException('Accès tontine refusé');
    }
    if (tontine.soldeActuelFcfa < montantFcfa) {
      throw new BadRequestException({
        message: `Solde insuffisant. Disponible: ${tontine.soldeActuelFcfa} FCFA`,
        code: 'SOLDE_INSUFFISANT',
      });
    }
    if (
      tontine.politique === PolitiqueRetrait.PROGRAMME &&
      tontine.dateDeverrouillage &&
      tontine.dateDeverrouillage > new Date()
    ) {
      throw new BadRequestException({
        message: 'Date de retrait programmée non atteinte',
        code: 'DATE_NON_ATTEINTE',
      });
    }
    if (tontine.politique === PolitiqueRetrait.BLOQUE) {
      throw new BadRequestException({
        message: 'Retrait assisté indisponible pour une tontine bloquée.',
        code: 'TONTINE_BLOQUEE',
      });
    }
  }

  private async executerRetraitApresConfirmation(operation: any) {
    const fraisRetrait = BUSINESS.calculerFraisRetrait(operation.montantFcfa);
    const montantNetFcfa = operation.montantFcfa - fraisRetrait;
    const transfert = await this.kkiapay.initierTransfert({
      montant: montantNetFcfa,
      telephone: operation.telephone,
      reference: `assist_retrait_${operation.id}`,
      motif: 'Retrait assisté client terrain',
    });

    const retrait = await this.prisma.$transaction(async (tx) => {
      const r = await tx.retrait.create({
        data: {
          utilisateurId: operation.clientId,
          tontineId: operation.tontineId,
          montantFcfa: operation.montantFcfa,
          statut: StatutRetrait.EXECUTE,
          refKKiaPay: transfert.refKKiaPay,
          executeLe: new Date(),
        },
      });
      await tx.tontine.update({
        where: { id: operation.tontineId },
        data: { soldeActuelFcfa: { decrement: operation.montantFcfa } },
      });
      await (tx as any).operationAssistee.update({
        where: { id: operation.id },
        data: {
          statut: 'SUCCES',
          retraitId: r.id,
          refMobileMoney: transfert.refKKiaPay,
          confirmationCanal: 'OTP_SMS',
          confirmeParClientLe: new Date(),
        },
      });
      return r;
    });

    await this.sms.envoyer(
      operation.telephone,
      `TontineBénin: Retrait ${montantNetFcfa} FCFA exécuté après votre confirmation. Frais ${fraisRetrait} FCFA. Réf: ${transfert.refKKiaPay}.`,
    );
    return retrait;
  }

  private async creerOtp() {
    const code = randomInt(100000, 1000000).toString();
    const hash = await bcrypt.hash(code, 10);
    const expireLe = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
    return { code, hash, expireLe };
  }
}

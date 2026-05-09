import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';
import { RafraichirTokenDto } from './dto/rafraichir-token.dto';
import { DemanderResetPinDto } from './dto/demander-reset-pin.dto';
import { VerifierOtpResetPinDto } from './dto/verifier-otp-reset-pin.dto';
import { ReinitialiserPinDto } from './dto/reinitialiser-pin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('inscription')
  inscription(@Body() dto: InscriptionDto) {
    return this.authService.inscription(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verifier-otp')
  verifierOtp(@Body() dto: VerifierOtpDto) {
    return this.authService.verifierOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('creer-pin')
  creerPin(
    @UtilisateurCourant() utilisateur: { id: string },
    @Body() dto: CreerPinDto,
    @Req() req: Request,
  ) {
    return this.authService.creerPin(utilisateur.id, dto, req);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('connexion')
  connexion(@Body() dto: ConnexionDto, @Req() req: Request) {
    return this.authService.connexion(dto, req);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('demander-reset-pin')
  demanderResetPin(@Body() dto: DemanderResetPinDto) {
    return this.authService.demanderResetPin(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verifier-otp-reset-pin')
  verifierOtpResetPin(@Body() dto: VerifierOtpResetPinDto) {
    return this.authService.verifierOtpResetPin(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reinitialiser-pin')
  reinitialiserPin(@Body() dto: ReinitialiserPinDto) {
    return this.authService.reinitialiserPin(dto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('rafraichir-token')
  rafraichirToken(
    @UtilisateurCourant() utilisateur: { id: string; telephone: string; role: any; sessionId: string },
    @Body() _dto: RafraichirTokenDto,
  ) {
    return this.authService.rafraichirToken(
      utilisateur.id,
      utilisateur.telephone,
      utilisateur.role,
      utilisateur.sessionId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('deconnexion')
  deconnexion(@UtilisateurCourant() utilisateur: { id: string; sessionId?: string }) {
    return this.authService.deconnexion(utilisateur.id, utilisateur.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deconnexion-tout')
  deconnexionTout(@UtilisateurCourant() utilisateur: { id: string; sessionId?: string }) {
    return this.authService.deconnexionTout(utilisateur.id, utilisateur.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  mesSessions(@UtilisateurCourant() utilisateur: { id: string; sessionId?: string }) {
    return this.authService.mesSessions(utilisateur.id, utilisateur.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/revoquer')
  revoquerSession(
    @UtilisateurCourant() utilisateur: { id: string; sessionId?: string },
    @Param('id') sessionId: string,
  ) {
    return this.authService.revoquerSession(utilisateur.id, sessionId, utilisateur.sessionId);
  }

  // ─── Biométrie ────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('biometrique/enregistrer')
  enregistrerAppareil(@UtilisateurCourant() u: { id: string }, @Body() dto: any) {
    return this.authService.enregistrerAppareilBiometrique(u.id, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('biometrique/connexion')
  connexionBiometrique(@Body() dto: any, @Req() req: Request) {
    return this.authService.connexionBiometrique(dto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('biometrique/appareils')
  mesAppareils(@UtilisateurCourant() u: { id: string }) {
    return this.authService.mesAppareils(u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('biometrique/appareils/:id')
  revoquerAppareil(@UtilisateurCourant() u: { id: string }, @Param('id') appareilId: string) {
    return this.authService.revoquerAppareil(u.id, appareilId);
  }

  // ─── Connexions suspectes (Admin) ─────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('connexions-suspectes')
  connexionsSuspectes(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limite', new DefaultValuePipe(50), ParseIntPipe) limite: number,
  ) {
    return this.authService.connexionsSuspectes(page, limite);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { InscriptionDto } from './dto/inscription.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { CreerPinDto } from './dto/creer-pin.dto';
import { ConnexionDto } from './dto/connexion.dto';
import { RafraichirTokenDto } from './dto/rafraichir-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { AuthGuard } from '@nestjs/passport';

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
  ) {
    return this.authService.creerPin(utilisateur.id, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('connexion')
  connexion(@Body() dto: ConnexionDto) {
    return this.authService.connexion(dto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('rafraichir-token')
  rafraichirToken(
    @UtilisateurCourant() utilisateur: { id: string; telephone: string; role: any },
    @Body() _dto: RafraichirTokenDto,
  ) {
    return this.authService.rafraichirToken(utilisateur.id, utilisateur.telephone, utilisateur.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deconnexion')
  deconnexion(@UtilisateurCourant() utilisateur: { id: string }) {
    return this.authService.deconnexion(utilisateur.id);
  }
}

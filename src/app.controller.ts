import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      succes: true,
      message: 'TontineBénin API opérationnelle',
      donnees: {
        statut: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

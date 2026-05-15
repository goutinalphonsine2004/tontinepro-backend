import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      succes: true,
      donnees: {
        statut: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('version')
  version() {
    return {
      version: '1.0.0',
    };
  }
}

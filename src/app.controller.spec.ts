import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return API health status', () => {
      const response = appController.health();

      expect(response.succes).toBe(true);
      expect(response.donnees.statut).toBe('ok');
      expect(response.donnees.version).toBe('1.0.0');
      expect(response.donnees.timestamp).toBeDefined();
    });
  });
});

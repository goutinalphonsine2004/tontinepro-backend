import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    // Non-blocking: Neon DB may take 10-15s to wake from sleep.
    // Pool connections are established on first query — no need to block bootstrap.
    this.$connect().catch((err: Error) => {
      console.warn('[Prisma] Initial connect warning (will retry on first query):', err.message);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

require('dotenv/config');

/** @type {import('prisma/config').PrismaConfig} */
module.exports = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Fallback dummy URL pour que prisma generate fonctionne en CI/CD sans DATABASE_URL
    url: process.env.DATABASE_URL || 'postgresql://ci:ci@localhost:5432/ci',
  },
};

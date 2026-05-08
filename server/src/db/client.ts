import type { PrismaClient as PrismaClientType } from '../../node_modules/.prisma/client';
import { dataFilePath } from '../core/paths';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${dataFilePath('dentalai.db')}`;
}

// Load Prisma after DATABASE_URL has been initialized.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../../node_modules/.prisma/client') as {
  PrismaClient: new (options?: ConstructorParameters<typeof PrismaClientType>[0]) => PrismaClientType;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

globalForPrisma.prisma = prisma;

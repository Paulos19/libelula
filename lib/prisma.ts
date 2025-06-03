import { PrismaClient } from '@prisma/client';

// Declara uma variável global para o cliente Prisma para que não seja recriada em cada hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria a instância do cliente Prisma, reutilizando a instância global se ela existir
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Opcional: Loga as queries executadas em ambiente de desenvolvimento
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Em ambiente de não produção, atribui o cliente à variável global
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
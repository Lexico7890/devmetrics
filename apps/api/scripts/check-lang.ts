import { PrismaClient } from '@devmetrics/database';
const prisma = new PrismaClient();
async function main() {
  const repos = await prisma.repository.findMany({ select: { name: true, language: true } });
  console.log(repos);
}
main().finally(() => prisma.$disconnect());

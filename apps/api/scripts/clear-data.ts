import { PrismaClient } from '@devmetrics/database';
const prisma = new PrismaClient();

async function main() {
  await prisma.commit.deleteMany({});
  await prisma.pullRequest.deleteMany({});
  await prisma.repository.deleteMany({});
  await prisma.syncJob.deleteMany({});
  console.log("All data cleared.");
}

main().finally(() => prisma.$disconnect());

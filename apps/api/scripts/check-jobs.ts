import { PrismaClient } from '@devmetrics/database';
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.syncJob.findMany({
    where: { 
      status: { in: ['failed', 'pending', 'active'] }
    }
  });
  console.log("Incomplete jobs:", jobs.length);
  
  const repos = await prisma.repository.findMany({ select: { name: true, language: true } });
  console.log("Repos:", repos.map(r => `${r.name}: ${r.language}`).join(", "));
}
main().finally(() => prisma.$disconnect());

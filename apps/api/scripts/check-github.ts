import { PrismaClient } from '@devmetrics/database';
import { CryptoService } from '../src/common/crypto.service';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return;
}
main();

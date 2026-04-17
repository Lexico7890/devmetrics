
import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findFirst({ orderBy: { lastLoginAt: 'desc' } });
        if (!user) {
            console.log("No user found");
            return;
        }

        console.log(`--- DIAGNOSTIC FOR USER: ${user.login} ---`);
        
        const commits = await prisma.commit.findMany({
            where: { userId: user.id },
            include: { repository: true },
            orderBy: { committedAt: 'desc' }
        });

        console.log(`Total commits in DB for user: ${commits.length}`);
        
        commits.forEach(c => {
            console.log(`SHA: ${c.sha.substring(0,7)} | Message: ${c.message} | Repo: ${c.repository.fullName} | Lines: ${c.additions + c.deletions} | Date: ${c.committedAt.toISOString()}`);
        });

        const prs = await prisma.pullRequest.findMany({
            where: { userId: user.id },
            include: { repository: true }
        });

        console.log(`\nTotal PRs in DB for user: ${prs.length}`);
        prs.forEach(p => {
            console.log(`ID: ${p.githubId} | Title: ${p.title} | Repo: ${p.repository.fullName} | State: ${p.state}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

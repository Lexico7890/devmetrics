import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findFirst({
            orderBy: { lastLoginAt: 'desc' }
        });

        if (!user) {
            console.log('No user found');
            return;
        }

        console.log(`Cleaning up data for user: ${user.username} (${user.id})`);

        // 1. Delete Merge Commits
        const deletedCommits = await prisma.commit.deleteMany({
            where: {
                userId: user.id,
                message: { startsWith: 'Merge ' }
            }
        });
        console.log(`Deleted ${deletedCommits.count} merge commits`);

        // 2. Delete ALL PRs for this user
        const deletedPRs = await prisma.pullRequest.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${deletedPRs.count} PRs for re-sync`);

        // 3. Reset personal bests
        await prisma.user.update({
            where: { id: user.id },
            data: {
                personalBests: { commits: 0, prs: 0, lines: 0, activeDays: 0 }
            }
        });
        console.log('Personal bests reset');

        // 4. Clear today's daily metric
        const today = new Date();
        today.setHours(0,0,0,0);
        await prisma.dailyMetric.deleteMany({
            where: { userId: user.id, date: today }
        });
        console.log('Daily metrics cleared for today');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

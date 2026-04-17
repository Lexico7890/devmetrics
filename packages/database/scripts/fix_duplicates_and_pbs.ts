
import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findFirst({ orderBy: { lastLoginAt: 'desc' } });
        if (!user) {
            console.log("No user found");
            return;
        }

        console.log(`Checking data for user: ${user.login} (${user.id})`);

        // 1. Check for duplicate repositories
        const repos = await prisma.repository.findMany({
            where: { userId: user.id }
        });
        
        const repoGroups: Record<number, any[]> = {};
        repos.forEach(r => {
            if (!repoGroups[r.githubId]) repoGroups[r.githubId] = [];
            repoGroups[r.githubId].push(r);
        });

        for (const [githubId, group] of Object.entries(repoGroups)) {
            if (group.length > 1) {
                console.log(`Duplicate repo found for GitHub ID ${githubId}:`, group.map(g => g.id));
                // We should keep only one. Let's keep the most recently updated one.
                const sorted = group.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                const toKeep = sorted[0];
                const toDelete = sorted.slice(1);
                
                for (const r of toDelete) {
                    console.log(`Deleting duplicate repository ${r.id} (${r.fullName})`);
                    await prisma.repository.delete({ where: { id: r.id } });
                }
            }
        }

        // 2. Clear Personal Bests to force re-calculation
        await prisma.user.update({
            where: { id: user.id },
            data: {
                personalBests: {
                    commits: 0,
                    prs: 0,
                    lines: 0,
                    activeDays: 0
                }
            }
        });
        console.log("Personal Bests reset to 0. They will re-calculate on next dashboard load.");

        // 3. Optional: Clear daily metrics for the user to force refresh
        await prisma.dailyMetric.deleteMany({
            where: { userId: user.id }
        });
        console.log("Deleted old daily metrics to ensure fresh start.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

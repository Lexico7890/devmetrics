import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("--- NUKE ANALYTICS SYSTEM ---");
        console.log("Cleaning up all data in 'analytics' and 'jobs' schemas...");

        // Schema: analytics
        const metricsCount = await prisma.dailyMetric.deleteMany({});
        console.log(`- Deleted ${metricsCount.count} daily_metrics`);

        const prsCount = await prisma.pullRequest.deleteMany({});
        console.log(`- Deleted ${prsCount.count} pull_requests`);

        const commitsCount = await prisma.commit.deleteMany({});
        console.log(`- Deleted ${commitsCount.count} commits`);

        const reposCount = await prisma.repository.deleteMany({});
        console.log(`- Deleted ${reposCount.count} repositories`);

        // Schema: jobs
        const syncJobsCount = await prisma.syncJob.deleteMany({});
        console.log(`- Deleted ${syncJobsCount.count} sync_jobs`);

        const webhooksCount = await prisma.webhookDelivery.deleteMany({});
        console.log(`- Deleted ${webhooksCount.count} webhook_deliveries`);

        // Schema: auth (Metadata update)
        console.log("Resetting Personal Bests for all users...");
        const usersCount = await prisma.user.updateMany({
            data: {
                personalBests: { commits: 0, prs: 0, lines: 0, activeDays: 0 }
            }
        });
        console.log(`- Reset Personal Bests for ${usersCount.count} users`);

        console.log("--- COMPLETED: CLEAN SLATE CREATED ---");
        console.log("You can now safely re-sync your account.");

    } catch (e) {
        console.error("CRITICAL ERROR during nuke operation:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

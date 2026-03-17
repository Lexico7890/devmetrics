import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaClient } from '@devmetrics/database';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        @InjectQueue('github-sync') private readonly syncQueue: Queue,
        private prisma: PrismaClient,
    ) { }

    async enqueueInitialSync(userId: string) {
        const jobRecord = await this.prisma.syncJob.create({
            data: {
                userId,
                jobType: 'INITIAL_SYNC',
                status: 'pending',
                priority: 10,
            },
        });

        await this.syncQueue.add(
            'sync-user-repos',
            { syncJobId: jobRecord.id, userId },
            {
                jobId: jobRecord.id,
                attempts: jobRecord.maxAttempts
            }
        );

        this.logger.log(`Job de sync encolado en BullMQ: ${jobRecord.id}`);
    }
}
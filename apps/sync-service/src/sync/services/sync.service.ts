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
        // 1. Crear el registro en tu tabla jobs.SyncJob
        const jobRecord = await this.prisma.syncJob.create({
            data: {
                userId,
                jobType: 'INITIAL_SYNC',
                status: 'pending',
                priority: 10,
            },
        });

        // 2. Encolar en BullMQ (Redis) pasándole el ID del SyncJob
        await this.syncQueue.add(
            'sync-user-repos',
            { syncJobId: jobRecord.id, userId },
            {
                jobId: jobRecord.id, // Sincronizamos los IDs para trazabilidad
                attempts: jobRecord.maxAttempts
            }
        );

        this.logger.log(`Job de sync encolado en BullMQ: ${jobRecord.id}`);
    }
}
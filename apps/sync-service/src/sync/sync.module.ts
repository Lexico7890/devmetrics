import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SyncService } from './services/sync.service';
import { SyncProcessor } from './processors/sync.processor';
import { RabbitMQController } from './controllers/rabbitmq.controller';
import { WebhookController } from './controllers/webhook.controller';
import { PrismaModule } from '../common/prisma.module';
import { CryptoService } from '../common/crypto.service';
import { RateLimiterService } from '../common/rate-limiter.service';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: 'github-sync',
        }),
    ],
    controllers: [RabbitMQController, WebhookController],
    providers: [SyncService, SyncProcessor, CryptoService, RateLimiterService],
})
export class SyncModule { }
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SyncModule } from './sync/sync.module';
import { PrismaModule } from './common/prisma.module';

@Module({
    imports: [
        PrismaModule,
        // Configuración global de Redis para BullMQ
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            },
        }),
        SyncModule,
    ],
})
export class AppModule { }
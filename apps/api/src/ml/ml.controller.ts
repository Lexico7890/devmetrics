// apps/api/src/ml/ml.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Controller('ml')
export class MLController {
    constructor(@InjectRedis() private readonly redis: Redis) { }

    @Get('features/:userId')
    async getFeatures(@Param('userId') userId: string) {
        const key = `features:${userId}:latest`;
        const features = await this.redis.get(key);

        if (!features) {
            return { error: 'No features found for user' };
        }

        return JSON.parse(features);
    }

    @Post('predict/:userId')
    async predict(@Param('userId') userId: string) {
        // 1. Get features from Redis (<10ms)
        const featuresData = await this.redis.get(`features:${userId}:latest`);
        if (!featuresData) {
            return { error: 'No features available' };
        }

        const features = JSON.parse(featuresData);

        // 2. Load model (cached in memory)
        // For now, return a simple baseline
        const prediction = {
            userId,
            predicted_commits_tomorrow: features.features.commits_avg_7d,
            confidence: 'medium',
            timestamp: new Date().toISOString()
        };

        // 3. Log prediction for monitoring
        await this.redis.lpush(`predictions:${userId}`, JSON.stringify(prediction));

        return prediction;
    }
}
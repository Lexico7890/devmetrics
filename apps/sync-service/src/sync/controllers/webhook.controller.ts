import { Controller, Post, Headers, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GithubWebhookGuard } from '../guards/github-webhook.guard';
import { PrismaClient } from '@devmetrics/database';

@Controller('webhooks/github')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        @InjectQueue('github-sync') private readonly syncQueue: Queue,
        private readonly prisma: PrismaClient,
    ) { }

    @Post()
    @UseGuards(GithubWebhookGuard)
    @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted: Le decimos a GitHub "Ya lo recibí, lo proceso luego"
    async handleWebhook(
        @Headers('x-github-event') event: string,
        @Headers('x-github-delivery') deliveryId: string,
        @Body() payload: any,
    ) {
        this.logger.log(`Recibido Webhook de GitHub - Evento: ${event} - ID: ${deliveryId}`);

        // 1. Guardar el payload crudo en la base de datos (por seguridad y auditoría)
        await this.prisma.webhookDelivery.create({
            data: {
                githubDeliveryId: deliveryId,
                event: event,
                action: payload.action || null,
                payload: payload,
                status: 'received',
            },
        });

        // 2. Dependiendo del evento, encolar un trabajo en BullMQ
        if (event === 'push') {
            // Si hacen un push, queremos procesar esos commits
            await this.syncQueue.add('sync-commits', {
                repositoryId: payload.repository.id,
                commits: payload.commits,
            }, {
                priority: 1, // Prioridad alta para que se refleje rápido en el dashboard
            });
        } else if (event === 'pull_request') {
            await this.syncQueue.add('sync-pr', {
                repositoryId: payload.repository.id,
                pullRequest: payload.pull_request,
            });
        }

        return { message: 'Webhook encolado correctamente' };
    }
}
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

        // Si GitHub envía la petición como form-urlencoded, el JSON vendrá como un string dentro de `payload`
        let parsedPayload = payload;
        if (payload && typeof payload.payload === 'string') {
            try {
                parsedPayload = JSON.parse(payload.payload);
            } catch (e) {
                this.logger.warn("El payload URL-encoded no pudo ser parseado a JSON");
            }
        }

        // 1. Guardar el payload (parseado si aplica) en la base de datos
        const deliveryData = await this.prisma.webhookDelivery.create({
            data: {
                githubDeliveryId: deliveryId,
                event: event,
                action: parsedPayload.action || null,
                payload: parsedPayload,
                status: 'received',
            },
        });

        try {
            // 2. Dependiendo del evento, encolar un trabajo en BullMQ
            if (event === 'push') {
                if (!parsedPayload.repository?.id) throw new Error("Falta payload.repository.id");

                await this.syncQueue.add('sync-commits', {
                    repositoryId: parsedPayload.repository.id,
                    commits: parsedPayload.commits,
                }, {
                    priority: 1,
                });
            } else if (event === 'pull_request') {
                if (!parsedPayload.repository?.id) throw new Error("Falta payload.repository.id");

                await this.syncQueue.add('sync-pr', {
                    repositoryId: parsedPayload.repository.id,
                    pullRequest: parsedPayload.pull_request,
                });
            }

            // Marcar como procesado exitosamente
            await this.prisma.webhookDelivery.update({
                where: { id: deliveryData.id },
                data: { status: 'processed' }
            });

            return { message: 'Webhook encolado correctamente' };
        } catch (error) {
            this.logger.error(`Error procesando webhook ${deliveryId}: ${error.message}`);
            
            // Si ocurre un error, actualizar la tabla con el mensaje de error para que no quede NULL
            await this.prisma.webhookDelivery.update({
                where: { id: deliveryData.id },
                data: {
                    status: 'failed',
                    errorMessage: error.message
                }
            });

            return { message: 'Error procesando webhook', error: error.message };
        }
    }
}
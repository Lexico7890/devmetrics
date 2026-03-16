import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { SyncService } from '../services/sync.service';

@Controller()
export class RabbitMQController {
    private readonly logger = new Logger(RabbitMQController.name);

    constructor(private readonly syncService: SyncService) { }

    // Escucha el evento emitido por tu servicio de Auth (api)
    @EventPattern('user.login_completed')
    async handleUserLogin(@Payload() data: { userId: string }, @Ctx() context: RmqContext) {
        this.logger.log(`Recibido evento de login para el usuario: ${data.userId}`);

        // Disparamos la lógica para encolar el trabajo en BullMQ
        await this.syncService.enqueueInitialSync(data.userId);

        // Confirmamos a RabbitMQ que procesamos el mensaje (Manual Ack si está configurado)
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
    }
}
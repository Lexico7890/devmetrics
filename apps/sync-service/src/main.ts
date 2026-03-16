import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
    // Habilitamos rawBody: true para poder validar firmas de Webhooks
    const app = await NestFactory.create(AppModule, {
        rawBody: true,
    });

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
            queue: 'sync_queue',
            noAck: false, // Habilita ACKs manuales
            queueOptions: { durable: true },
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.PORT || 4002);

    console.log(`🚀 Sync Service corriendo en puerto ${process.env.PORT || 4002}`);
}
bootstrap();

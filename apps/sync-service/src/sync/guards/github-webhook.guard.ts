import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class GithubWebhookGuard implements CanActivate {
    private readonly logger = new Logger(GithubWebhookGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();
        const signature = req.headers['x-hub-signature-256'] as string;

        if (!signature) {
            this.logger.warn('Intento de webhook sin firma');
            throw new UnauthorizedException('Firma no proporcionada');
        }

        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (!secret) {
            this.logger.error('GITHUB_WEBHOOK_SECRET no está definido en las variables de entorno');
            throw new Error('Configuración de servidor incompleta');
        }

        // req.rawBody es un Buffer gracias a { rawBody: true } en main.ts
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(req['rawBody']).digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
            this.logger.warn('Firma de webhook inválida');
            throw new UnauthorizedException('Firma inválida');
        }

        return true;
    }
}
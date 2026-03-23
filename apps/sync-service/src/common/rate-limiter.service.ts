import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterService {
    private readonly logger = new Logger(RateLimiterService.name);
    private readonly redis: Redis;

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
    }

    /**
     * Sliding Window Rate Limiter
     * @param key Identificador único (ej: github-api-user-123)
     * @param limit Límite máximo de peticiones por ventana
     * @param windowMs Tamaño de la ventana de tiempo en milisegundos
     * @returns boolean true si la petición es permitida, false si fue bloqueada
     */
    async isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - windowMs;
        const redisKey = `rate-limit:${key}`;

        // 1. Limpiar los registros antiguos fuera de la ventana
        await this.redis.zremrangebyscore(redisKey, 0, windowStart);

        // 2. Contar cuántas peticiones quedan en la ventana actual
        const currentCount = await this.redis.zcard(redisKey);

        if (currentCount >= limit) {
            this.logger.warn(`Rate limit excedido para clave: ${key}`);
            return true; // Bloqueado
        }

        // 3. Registrar la nueva petición (score = timestamp, value = timestamp-rand para asegurar unicidad)
        await this.redis.zadd(redisKey, now, `${now}-${Math.random()}`);

        // 4. Renovar el TTL de la clave para que no se acumule basura en Redis
        // Expiramos la clave en windowMs + 10s extra de margen
        await this.redis.expire(redisKey, Math.ceil(windowMs / 1000) + 10);

        return false; // Permitido
    }
}

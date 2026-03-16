// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@devmetrics/database';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import type { SignOptions } from 'jsonwebtoken';

interface JwtPayload {
  sub: string; // userId — "subject" es la convención JWT
  login: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaClient,
    @Inject('RABBITMQ_CLIENT') private readonly rabbitClient: ClientProxy,
  ) {}

  // Llamado por la GitHub Strategy de Passport después del OAuth dance exitoso
  async handleGithubCallback(profile: {
    githubId: number;
    username: string; // ← agregamos
    login: string;
    email: string | null;
    avatarUrl: string | null;
    displayName: string | null;
    githubToken: string;
  }) {
    const user = await this.usersService.findOrCreate(profile);
    
    // Emitir el evento a RabbitMQ para que el sync-service inicie la sincronización
    this.rabbitClient.emit('user.login_completed', { userId: user.id });

    return this.generateTokenPair(user.id, user.login);
  }

  async generateTokenPair(userId: string, login: string) {
    const payload: JwtPayload = { sub: userId, login };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
        '15m') as SignOptions['expiresIn'],
    });

    // El refresh token es un JWT también, pero con secret diferente y más duración
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
        '7d') as SignOptions['expiresIn'],
    });

    // Guardamos un hash del refresh token en la DB (no el token en texto plano)
    // Si alguien roba la DB, no puede usar los refresh tokens
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Calculamos cuándo expira para poder limpiarlo después
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Guardamos la sesión en la DB
    await this.prisma.session.create({
      data: {
        userId,
        token: `legacy_${hashedRefreshToken}`, // campo requerido del schema original
        refreshTokenHash: hashedRefreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    // 1. Verificar que el JWT es válido y no expiró
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Verificar que el token existe en la DB (no fue revocado)
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session not found or expired');
    }

    // 3. Rotar: eliminar sesión vieja, crear par nuevo
    // Esto asegura que cada refresh token solo se puede usar UNA vez
    await this.prisma.session.delete({ where: { id: session.id } });

    return this.generateTokenPair(payload.sub, payload.login);
  }

  async logout(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    // Eliminamos la sesión — el access token expirará solo en 15 min
    await this.prisma.session.deleteMany({
      where: { refreshTokenHash: hash },
    });
  }

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }
}

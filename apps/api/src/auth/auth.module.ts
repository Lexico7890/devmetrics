// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './auth.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PassportModule,
    // Registramos JwtModule sin secret global — cada sign/verify especifica el suyo
    // Esto es intencional para manejar dos secrets distintos (access vs refresh)
    JwtModule.register({}),
    UsersModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'sync_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, GithubStrategy, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard], // Exportamos para usarlos en otros módulos
})
export class AuthModule {}

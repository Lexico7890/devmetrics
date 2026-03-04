import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@devmetrics/database';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, // ← debe estar aquí
  ],
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        return new PrismaClient({
          log:
            process.env.NODE_ENV === 'development'
              ? ['query', 'error', 'warn']
              : ['error'],
        });
      },
    },
  ],
  exports: [PrismaClient],
})
export class AppModule {}

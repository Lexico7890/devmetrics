// apps/api/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { CryptoService } from '../common/crypto.service';

@Module({
  providers: [UsersService, CryptoService],
  exports: [UsersService],
})
export class UsersModule {}

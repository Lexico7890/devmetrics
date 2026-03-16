import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@devmetrics/database';

@Global()
@Module({
    providers: [PrismaClient],
    exports: [PrismaClient],
})
export class PrismaModule { }

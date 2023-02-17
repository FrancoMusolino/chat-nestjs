import { Global, Module } from '@nestjs/common';
import { BcryptService } from './auth/bcrypt/bcrypt.service';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, BcryptService],
  exports: [PrismaService],
})
export class PrismaModule {}

import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  providers: [MessagesService, PrismaService],
  exports: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}

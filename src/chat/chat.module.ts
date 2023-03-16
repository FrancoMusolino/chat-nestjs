import { Module } from '@nestjs/common';

import { UsersModule } from 'src/auth/users/users.module';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessagesModule } from './messages/messages.module';
import { ChatGateway } from './chat.gateway';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [UsersModule, MessagesModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, NotificationService],
})
export class ChatModule {}

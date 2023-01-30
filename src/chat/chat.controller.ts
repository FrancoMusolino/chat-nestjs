import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dtos/createChat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Req() req: any, @Body() newChat: CreateChatDto) {
    const { user } = req;
    const { title } = newChat;

    return this.chatService.createChat({
      title,
      createdBy: user.username,
      userIDs: [user.id],
    });
  }
}

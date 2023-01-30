import {
  Controller,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { CreateChatDto } from './dtos/createChat.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ValidationObjectIdPipe } from 'src/.shared/pipes/ValidationObjectId.pipe';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Body() newChat: CreateChatDto, @Req() req: any) {
    const { user } = req;
    const { title } = newChat;

    return await this.chatService.createChat({
      title,
      createdBy: user.username,
      userIDs: [user.id],
    });
  }

  @Patch('abandonar-chat/:ID')
  async leaveChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Req() req: any,
  ) {
    const { user } = req;

    return await this.chatService.leaveChat(id, user);
  }
}

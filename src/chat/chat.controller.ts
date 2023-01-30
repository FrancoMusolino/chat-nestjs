import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  HttpCode,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { CreateChatDto } from './dtos/createChat.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ValidationObjectIdPipe } from 'src/.shared/pipes/ValidationObjectId.pipe';
import { AddIntegrantToChatDto } from './dtos/addIntegrantToChat.dto';
import { ChatAuthorizationGuard } from './guards/ChatAuthorization.guard';

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

  @UseGuards(new ChatAuthorizationGuard())
  @Post(':ID/sumar-integrante')
  @HttpCode(200)
  async addIntegrantToChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() newIntegrant: AddIntegrantToChatDto,
  ) {
    return await this.chatService.addIntegrantToChat(id, newIntegrant);
  }

  @UseGuards(new ChatAuthorizationGuard())
  @Post(':ID/abandonar-chat')
  @HttpCode(200)
  async leaveChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Req() req: any,
  ) {
    const { user } = req;

    return await this.chatService.leaveChat(id, user);
  }
}

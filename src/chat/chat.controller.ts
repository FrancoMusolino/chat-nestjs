import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  HttpCode,
  Patch,
  Delete,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { ValidationObjectIdPipe } from 'src/.shared/pipes';
import { ChatAuthorizationGuard } from './guards';
import {
  AddIntegrantToChatDto,
  CreateChatDto,
  PushOutFromChatDto,
  UpdateChatDto,
} from './dtos';

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

  @UseGuards(ChatAuthorizationGuard)
  @Post(':ID/sumar-integrante')
  @HttpCode(200)
  async addIntegrantToChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() newIntegrant: AddIntegrantToChatDto,
  ) {
    return await this.chatService.addIntegrantToChat(id, newIntegrant);
  }

  @UseGuards(ChatAuthorizationGuard)
  @Post(':ID/abandonar-chat')
  @HttpCode(200)
  async leaveChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Req() req: any,
  ) {
    const { user } = req;

    return await this.chatService.leaveChat(id, user);
  }

  @UseGuards(ChatAuthorizationGuard)
  @Post(':ID/expulsar-chat')
  @HttpCode(200)
  async pushOutFromChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() integrantPushedOut: PushOutFromChatDto,
    @Req() req: any,
  ) {
    const { user } = req;

    return await this.chatService.pushOutFromChat(id, user, integrantPushedOut);
  }

  @UseGuards(ChatAuthorizationGuard)
  @Patch(':ID')
  async updateChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() updatedChat: UpdateChatDto,
  ) {
    return await this.chatService.updateChat(id, updatedChat);
  }

  @UseGuards(ChatAuthorizationGuard)
  @Delete(':ID')
  async deleteChat(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Req() req: any,
  ) {
    const { user } = req;

    return await this.chatService.deleteChat(id, user.username);
  }
}

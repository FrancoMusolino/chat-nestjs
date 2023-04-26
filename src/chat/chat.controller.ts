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
  Get,
  Query,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { ValidationObjectIdPipe } from 'src/.shared/pipes';
import { ChatAuthorizationGuard } from './guards/chatAuthorization.guard';
import {
  AddIntegrantToChatDto,
  CreateChatDto,
  PushOutFromChatDto,
  UpdateChatDto,
} from './dtos';
import { CreateMessageDto } from './messages/dtos';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(ChatAuthorizationGuard)
  @Get(':ID')
  async getChat(@Param('ID', ValidationObjectIdPipe) chatId: string) {
    return await this.chatService.getChat({ id: chatId });
  }

  @UseGuards(ChatAuthorizationGuard)
  @Get(':ID/mensajes')
  async getChatMessages(
    @Param('ID', ValidationObjectIdPipe) chatId: string,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ) {
    return await this.chatService.getChatMessages({ id: chatId }, +take, +skip);
  }

  @UseGuards(ChatAuthorizationGuard)
  @Get(':ID/integrantes')
  async getChatIntegrants(@Param('ID', ValidationObjectIdPipe) chatId: string) {
    return await this.chatService.getChatIntegrants({ id: chatId });
  }

  @Post()
  async createChat(@Body() newChat: CreateChatDto, @Req() req: any) {
    const { user } = req;

    return await this.chatService.createChat({
      ...newChat,
      createdBy: user.username,
    });
  }

  @UseGuards(ChatAuthorizationGuard)
  @Post(':ID/enviar-mensaje')
  async submitMessage(
    @Param('ID', ValidationObjectIdPipe) chatId: string,
    @Body() newMessage: CreateMessageDto,
    @Req() req: any,
  ) {
    const { user } = req;
    const { content } = newMessage;

    return await this.chatService.submitMessage({
      content,
      userId: user.id,
      chatId,
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

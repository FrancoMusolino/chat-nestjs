import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { convertDateToArgTZ } from 'src/.shared/helpers';

import { ValidationObjectIdPipe } from 'src/.shared/pipes';
import { SocketWithAuth } from 'src/.shared/types';
import { UsersService } from 'src/auth/users/users.service';
import { ChatAuthorizationGuard } from './guards';
import { ExtendedCreateMessageDto } from './messages/dtos';

@WebSocketGateway(8080)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly userService: UsersService) {}

  @WebSocketServer() server: Server;

  afterInit(server: any) {
    console.log('WS Server inicializado');
  }

  handleConnection(client: SocketWithAuth, ...args: any[]) {
    const { user } = client;

    this.userService.updateUser(
      { id: user.id },
      { connected: true, lastConnection: null },
    );

    console.log(`Nuevo cliente ${client.id} conectado`);
  }

  handleDisconnect(client: SocketWithAuth) {
    const { user } = client;

    const lastConnection = String(convertDateToArgTZ(new Date()));

    this.userService.updateUser(
      { id: user.id },
      { connected: false, lastConnection },
    );

    console.log(`Cliente ${client.id} desconectado`);
  }

  @UseGuards(ChatAuthorizationGuard)
  @SubscribeMessage('event_join')
  handleJoinChat(
    @MessageBody('chatId') chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Uniéndose al chat ${chatId}`);
    client.join(`chat_${chatId}`);
  }

  @SubscribeMessage('event_leave')
  handleLeaveChat(
    @MessageBody('chatId', ValidationObjectIdPipe) chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Dejando el chat ${chatId}`);
    client.leave(`chat_${chatId}`);
  }

  @UseGuards(ChatAuthorizationGuard)
  @SubscribeMessage('event_message')
  handleIncomingMessage(
    @MessageBody() newMessage: ExtendedCreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId } = newMessage;

    // TODO: agregamos broadcast al client?? / El evento lo emite el server o el client??
    this.server.to(`chat_${chatId}`).emit('new_message', newMessage);
  }
}

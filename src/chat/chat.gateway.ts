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
import { Message } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { DateTime } from 'src/.shared/helpers';
import { ValidationObjectIdPipe } from 'src/.shared/pipes';
import { SocketWithAuth } from 'src/.shared/types';
import { UsersService } from 'src/auth/users/users.service';
import { ChatAuthorizationGuard } from './guards';

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

    const lastConnection = String(DateTime.now().date);

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
  @SubscribeMessage('event_submit_message')
  handleIncomingMessage(
    @MessageBody() newMessage: Message,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const { chatId } = newMessage;

    client.broadcast
      .to(`chat_${chatId}`)
      .emit('event_receive_message', newMessage);

    this.handleLastChatMessage(client, newMessage);
  }

  handleLastChatMessage(emmiter: SocketWithAuth, message: Message) {
    const { chatId, content, createdAt } = message;

    const chatIntegrants = Array.from(this.server.sockets.sockets)
      .map((client) => client[1])
      .filter(
        (client: SocketWithAuth) =>
          client.user.chatIDs.includes(chatId) &&
          !client.rooms.has(`chat_${chatId}`),
      );

    const room = `last_message_in_chat_${chatId}`;

    chatIntegrants.forEach((client) => client.join(room));

    emmiter.broadcast.to(room).emit('event_new_last_message', {
      chatId,
      content,
      createdAt,
      user: { username: emmiter.user.username },
    });

    chatIntegrants.forEach((client) => client.leave(room));
  }

  @UseGuards(ChatAuthorizationGuard)
  @SubscribeMessage('event_add_integrant')
  handleAddChatIntegrant(
    @MessageBody() payload: { chatId: string; username: string },
  ) {
    const { username } = payload;

    const user = Array.from(this.server.sockets.sockets)
      .map((client) => client[1])
      .find((client: SocketWithAuth) => client.user.username === username);

    if (user) {
      this.server.to(user.id).emit('event_added_to_chat');
    }
  }

  @UseGuards(ChatAuthorizationGuard)
  @SubscribeMessage('event_push_out_integrant')
  handlePushOutIntegrant(
    @MessageBody() payload: { chatId: string; username: string },
  ) {
    const { username, chatId } = payload;

    const user = Array.from(this.server.sockets.sockets)
      .map((client) => client[1])
      .find((client: SocketWithAuth) => client.user.username === username);

    if (user) {
      this.server.to(user.id).emit('event_pushed_out_chat', { chatId });
    }
  }
}

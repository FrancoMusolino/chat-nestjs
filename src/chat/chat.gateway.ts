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

import { ValidationObjectIdPipe } from 'src/.shared/pipes';
import { ExtendedCreateMessageDto } from './messages/dtos';

@WebSocketGateway(8080, { cors: '*' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: any) {
    console.log('WS Server inicializado');
  }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Nuevo cliente ${client.id} conectado`);
  }

  handleDisconnect(client: any) {
    console.log({ client });
    console.log(`Cliente ${client.id} desconectado`);
  }

  @SubscribeMessage('event_join')
  handleJoinChat(
    @MessageBody('chatId', ValidationObjectIdPipe) chatId: string,
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

  @SubscribeMessage('event_message')
  handleIncomingMessage(
    @MessageBody() newMessage: ExtendedCreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId } = newMessage;
    this.server.to(`chat_${chatId}`).emit('new_message', newMessage);
  }
}

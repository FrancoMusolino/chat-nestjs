import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    let user: any;
    let chatId: string;

    const isHttp = context.getType().includes('http');

    if (isHttp) {
      const request = context.switchToHttp().getRequest();
      user = request.user;
      chatId = request.params.ID;
    } else {
      const client = context.switchToWs().getClient();
      const data = context.switchToWs().getData();

      user = client.user;
      chatId = data.chatId;
    }

    if (!user.chatIDs || !user.chatIDs.includes(chatId)) {
      throw isHttp
        ? new UnauthorizedException('No perteneces a este chat')
        : new WsException('No perteneces a este chat');
    }

    return true;
  }
}

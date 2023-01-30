import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ChatAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const { user } = request;
    const { ID } = request.params;

    if (!user.chatIDs || !user.chatIDs.includes(ID)) {
      throw new UnauthorizedException('No perteneces a este chat');
    }

    return true;
  }
}

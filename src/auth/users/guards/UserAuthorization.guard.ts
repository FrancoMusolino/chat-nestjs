import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class UserAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = request.params.ID;

    if (user.id !== userId) {
      throw new UnauthorizedException(
        'No estás autorizado para realizar esta acción',
      );
    }

    return true;
  }
}

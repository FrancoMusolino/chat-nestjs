import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { ExtendedError } from 'socket.io/dist/namespace';

import { JwtPayload, SocketWithAuth } from '../types';
import { UsersService } from '../../auth/users/users.service';

export const socketAuthMiddleware =
  (jwtService: JwtService, userService: UsersService) =>
  async (socket: SocketWithAuth, next: (err?: ExtendedError) => void) => {
    const { auth, headers } = socket.handshake;

    if (!auth.token && !headers['token']) {
      return next(new WsException('Usuario no autenticado'));
    }

    try {
      const { id, username }: JwtPayload = jwtService.verify(auth.token);

      const existUser = await userService.getUser({ id });

      if (!existUser) {
        throw new WsException(`El usuario ${username} no existe`);
      }

      const { password, chats, messages, ...user } = existUser;

      socket.user = user;

      return next();
    } catch (error) {
      return next(error);
    }
  };

import { INestApplicationContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';

import { socketAuthMiddleware } from './.shared/middlewares';
import { UsersService } from './auth/users/users.service';

export class SocketIoAdapter extends IoAdapter {
  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: any) {
    const optionsWithCors: ServerOptions = {
      ...options,
      cors: {
        origin: '*',
      },
    };

    const jwtService = this.app.get(JwtService);
    const userService = this.app.get(UsersService);

    const server: Server = super.createIOServer(port, optionsWithCors);

    server.use(socketAuthMiddleware(jwtService, userService));

    return server;
  }
}

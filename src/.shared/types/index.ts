import { Socket } from 'socket.io';
import { User } from '@prisma/client';

export type JwtPayload = {
  id: string;
  username: string;
};

export type SocketWithAuth = Socket & { user: Omit<User, 'password'> };

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from 'src/.shared/types';
import { NotificationService } from 'src/notification/notification.service';
import { UserDeletedException } from './../.shared/exceptions';
import { BcryptService } from './bcrypt/bcrypt.service';
import { LoginDto, RegisterDto } from './dtos';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwt: JwtService,
    private readonly bcrypt: BcryptService,
    private readonly notification: NotificationService,
  ) {}

  private signToken(payload: JwtPayload) {
    return this.jwt.sign(payload);
  }

  async register({ username, password }: RegisterDto) {
    const user = await this.userService.createUser({ username, password });

    await this.notification.addSubscriber(user.id, {
      data: { username: user.username },
    });

    const { password: hashPassword, ...rest } = user;

    return {
      ...rest,
      token: this.signToken({ id: user.id, username: user.username }),
    };
  }

  async login({ username, password }: LoginDto) {
    const existUser = await this.userService.getUser(
      { username },
      { chats: false, messages: false },
    );

    if (!existUser) {
      throw new NotFoundException(`Usuario ${username} no encontrado`);
    }

    if (existUser.deleted) {
      throw new UserDeletedException(username);
    }

    const { password: hashPassword, id, ...user } = existUser;

    const isValidPassword = await this.bcrypt.validate(password, hashPassword);

    if (!isValidPassword) {
      throw new UnauthorizedException('Las credenciales son inválidas');
    }

    return { id, ...user, token: this.signToken({ id, username }) };
  }
}

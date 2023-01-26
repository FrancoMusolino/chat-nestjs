import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { LoginDto, RegisterDto } from './dtos';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private signToken(payload: { id: string; username: string }) {
    return this.jwt.sign(payload);
  }

  async register({ username, password }: RegisterDto) {
    const user = await this.userService.createUser({ username, password });

    const { password: hashPassword, ...rest } = user;

    return {
      ...rest,
      token: this.signToken({ id: user.id, username: user.username }),
    };
  }

  async login({ username, password }: LoginDto) {
    const existUser = await this.userService.getUser({ username });

    if (!existUser) {
      throw new NotFoundException(`Usuario ${username} no encontrado`);
    }

    const { password: hashPassword, id, ...user } = existUser;

    const isValidPassword = await compare(password, hashPassword);

    if (!isValidPassword) {
      throw new UnauthorizedException('Las credenciales son inválidas');
    }

    return { id, ...user, token: this.signToken({ id, username }) };
  }
}

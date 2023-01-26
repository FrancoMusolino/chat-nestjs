import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import { LoginDto, RegisterDto } from './dtos';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UsersService) {}

  async register({ username, password }: RegisterDto) {
    return this.userService.createUser({ username, password });
  }

  async login({ username, password }: LoginDto) {
    const existUser = await this.userService.getUser({ username });

    if (!existUser) {
      throw new NotFoundException(`Usuario ${username} no encontrado`);
    }

    const { password: hashPassword, ...rest } = existUser;

    const isValidPassword = await compare(password, hashPassword);

    if (!isValidPassword) {
      throw new UnauthorizedException('Las credenciales son inválidas');
    }

    return rest;
  }
}

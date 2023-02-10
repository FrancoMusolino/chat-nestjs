import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, ExtendedUpdateUserDto } from './dtos';
import { UsernameInUseException } from 'src/.shared/exceptions';
import { convertDateToArgTZ } from 'src/.shared/helpers';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async getFirstUserOrThrow(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findFirstOrThrow({ where });
  }

  async getUser(where: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({
      where,
      include: { chats: true, messages: true },
    });
  }

  async getManyUsers(
    where: Prisma.UserScalarWhereInput,
    select?: Prisma.UserSelect,
  ) {
    return await this.prisma.user.findMany({
      where,
      select,
    });
  }

  async createUser({
    username,
    password,
    avatar,
  }: CreateUserDto): Promise<User> {
    const existUser = await this.getUser({ username });

    if (existUser) {
      throw new UsernameInUseException(username);
    }

    const createdAt = convertDateToArgTZ(new Date());

    return await this.prisma.user.create({
      data: { username, password, avatar, createdAt },
    });
  }

  async updateUser(
    where: Prisma.UserWhereUniqueInput,
    data: ExtendedUpdateUserDto,
  ) {
    await this.getFirstUserOrThrow(where).catch((error) => {
      console.log(error);
      throw new NotFoundException('Usuario no encontrado');
    });

    try {
      return await this.prisma.user.update({ where, data });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error actualizando al usuario');
    }
  }
}

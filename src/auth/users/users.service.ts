import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, ExtendedUpdateUserDto, UpdateUserDto } from './dtos';
import { UsernameInUseException } from 'src/.shared/exceptions';

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
    profilePicture,
    status,
  }: CreateUserDto): Promise<User> {
    const existUser = await this.getUser({ username });

    if (existUser) {
      throw new UsernameInUseException(username);
    }

    return await this.prisma.user.create({
      data: { username, password, profilePicture, status },
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
      const { password, ...user } = await this.prisma.user.update({
        where,
        data,
      });

      return user;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error actualizando al usuario');
    }
  }
}

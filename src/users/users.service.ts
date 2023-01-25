import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { UsernameInUseException } from 'src/shared/exceptions';
import { convertDateToArgTZ } from 'src/shared/helpers';
import { CreateUserDto } from './dtos';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser({
    username,
    password,
    avatar,
  }: CreateUserDto): Promise<any> {
    const existUser = await this.getUser({ username });

    if (existUser) {
      throw new UsernameInUseException(username);
    }

    const createdAt = convertDateToArgTZ(new Date());

    return await this.prisma.user.create({
      data: { username, password, avatar, createdAt },
    });
  }

  async getUser(where: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({ where });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dtos';
import { UsernameInUseException } from 'src/.shared/exceptions';
import { convertDateToArgTZ } from 'src/.shared/helpers';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(
    where: Prisma.UserWhereUniqueInput,
    include?: Prisma.UserInclude,
  ) {
    return await this.prisma.user.findUnique({
      where,
      include,
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

  async getFirstUserOrThrow(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findFirstOrThrow({ where });
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
}

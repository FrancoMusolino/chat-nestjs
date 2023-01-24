import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { UsernameInUseException } from 'src/shared/exceptions';
import { CreateUserDto } from './dtos';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser({ username }: CreateUserDto): Promise<any> {
    const existUser = this.getUser({ username });

    if (existUser) {
      throw new UsernameInUseException(username);
    }

    return await this.prisma.user.create({ data: { username } });
  }

  async getUser(where: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({ where });
  }
}

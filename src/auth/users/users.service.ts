import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { CreateUserDto, DeleteUserDto, ExtendedUpdateUserDto } from './dtos';
import { UsernameInUseException } from 'src/.shared/exceptions';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly cloudinary: CloudinaryService,
    private readonly notification: NotificationService,
  ) {}
  async getFirstUserOrThrow(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findFirstOrThrow({ where });
  }

  async getUser(
    where: Prisma.UserWhereUniqueInput,
    include: Prisma.UserInclude = { chats: true, messages: true },
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

  async getUserChats(where: Prisma.UserWhereUniqueInput) {
    const user = await this.prisma.user.findUnique({
      where,
      select: {
        chats: {
          orderBy: {
            lastMessageSendingAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            createdBy: true,
            description: true,
            avatar: true,
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                content: true,
                createdAt: true,
                user: { select: { username: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
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
    const existUser = await this.getFirstUserOrThrow(where).catch((error) => {
      console.log(error);
      throw new NotFoundException('Usuario no encontrado');
    });

    try {
      const { password, ...user } = await this.prisma.user.update({
        where,
        data,
      });

      if (data.profilePicture && existUser.profilePicture) {
        await this.cloudinary.deleteAsset(existUser.profilePicture);
      }

      return user;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error actualizando al usuario');
    }
  }

  async deleteUser(userId: string, { password }: DeleteUserDto) {
    const { password: hashedPassword } = await this.getFirstUserOrThrow({
      id: userId,
    }).catch((error) => {
      console.log(error);
      throw new NotFoundException('Usuario no encontrado');
    });

    const isValidPassword = await this.bcrypt.validate(
      password,
      hashedPassword,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Las credenciales son inválidas');
    }

    const chatsWhichUserBelongTo = await this.prisma.chat.findMany({
      where: { userIDs: { has: userId } },
    });

    const chatsUpdatedUsers = chatsWhichUserBelongTo.map((chat) => ({
      ...chat,
      userIDs: chat.userIDs.filter((id) => id !== userId),
    }));

    try {
      const [deletedUser] = await this.prisma.$transaction(
        [
          this.prisma.user.delete({ where: { id: userId } }),
          chatsUpdatedUsers.map((chat) =>
            chat.userIDs.length
              ? this.prisma.chat.update({
                  where: { id: chat.id },
                  data: { users: { disconnect: { id: userId } } },
                })
              : this.prisma.chat.delete({
                  where: { id: chat.id },
                }),
          ),
        ].flat(),
      );

      await this.notification.removeSubscriber(deletedUser.id);

      return deletedUser;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error eliminando al usuario');
    }
  }
}

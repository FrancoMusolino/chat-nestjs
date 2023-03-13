import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/auth/users/users.service';
import {
  ExtendedCreateChatDto,
  AddIntegrantToChatDto,
  UpdateChatDto,
  PushOutFromChatDto,
} from './dtos';
import { ExtendedCreateMessageDto } from './messages/dtos';
import { MessagesService } from './messages/messages.service';
import { UserDeletedException } from 'src/.shared/exceptions';
import { DateTime } from 'src/.shared/helpers';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly messageService: MessagesService,
  ) {}

  async getFirstChatOrThrow(where: Prisma.ChatWhereUniqueInput) {
    return await this.prisma.chat.findFirstOrThrow({
      where,
    });
  }

  async getChat(where: Prisma.ChatWhereUniqueInput) {
    return await this.prisma.chat.findUnique({
      where,
      include: {
        messages: true,
        users: { select: { id: true, username: true, profilePicture: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async getChatMessages(where: Prisma.ChatWhereUniqueInput) {
    const chat = await this.prisma.chat.findUnique({
      where,
      select: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            deleted: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    return chat;
  }

  async createChat({
    createdBy,
    title,
    description,
    avatar,
  }: ExtendedCreateChatDto) {
    try {
      return await this.prisma.chat.create({
        data: {
          title,
          description,
          avatar,
          createdBy,
          users: { connect: { username: createdBy } },
        },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al crear el chat');
    }
  }

  async submitMessage({ chatId, ...message }: ExtendedCreateMessageDto) {
    await this.getFirstChatOrThrow({ id: chatId }).catch((error) => {
      console.log(error);
      throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
    });

    await this.updateChat(chatId, {
      lastMessageSendingAt: DateTime.now().date,
    });

    return await this.messageService.createMessage({ chatId, ...message });
  }

  async addIntegrantToChat(
    chatId: string,
    { username }: AddIntegrantToChatDto,
  ) {
    const chat = await this.getFirstChatOrThrow({ id: chatId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
      },
    );

    const user = await this.userService
      .getFirstUserOrThrow({ username })
      .catch((error) => {
        console.log(error);
        throw new NotFoundException(
          `Usuario con username ${username} no encontrado`,
        );
      });

    if (user.deleted) {
      throw new UserDeletedException(user.username);
    }

    if (chat.userIDs.includes(user.id)) {
      throw new ConflictException(
        `El usuario ${username} ya pertenece al chat`,
      );
    }

    try {
      return await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          users: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al añadir el usuario al chat');
    }
  }

  async leaveChat(chatId: string, user: User) {
    const { id: userId } = user;

    const chat = await this.getFirstChatOrThrow({ id: chatId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
      },
    );

    const newChatIntegrants = chat.userIDs.filter((id) => id !== userId);

    try {
      if (!newChatIntegrants.length) {
        const newUserChats = user.chatIDs.filter((id) => id !== chatId);

        const [chat] = await this.prisma.$transaction([
          this.prisma.chat.delete({ where: { id: chatId } }),
          this.prisma.user.update({
            where: { id: userId },
            data: { chatIDs: newUserChats },
          }),
        ]);

        return chat;
      }

      return await this.prisma.chat.update({
        where: { id: chatId },
        data: { users: { disconnect: { id: userId } } },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al abandonar el chat');
    }
  }

  async pushOutFromChat(
    chatId: string,
    user: User,
    { username }: PushOutFromChatDto,
  ) {
    const chat = await this.getFirstChatOrThrow({ id: chatId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
      },
    );

    const userToPushOut = await this.userService
      .getFirstUserOrThrow({ username })
      .catch((error) => {
        console.log(error);
        throw new NotFoundException(
          `Usuario con username ${username} no encontrado`,
        );
      });

    if (!userToPushOut.chatIDs.includes(chatId)) {
      throw new ConflictException(
        `El usuario ${username} no pertenece a este chat`,
      );
    }

    if (chat.createdBy !== user.username) {
      throw new UnauthorizedException(
        'Solo el creador del chat puede realizar esta acción',
      );
    }

    try {
      return await this.prisma.chat.update({
        where: { id: chatId },
        data: { users: { disconnect: { username: userToPushOut.username } } },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al expulsar del chat');
    }
  }

  async updateChat(chatId: string, data: UpdateChatDto) {
    await this.getFirstChatOrThrow({ id: chatId }).catch((error) => {
      console.log(error);
      throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
    });

    try {
      return await this.prisma.chat.update({
        where: { id: chatId },
        data,
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al actualizar el chat');
    }
  }

  async deleteChat(chatId: string, username: string) {
    const chat = await this.getFirstChatOrThrow({ id: chatId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
      },
    );

    if (chat.createdBy !== username) {
      throw new UnauthorizedException(
        'Solo el creador del chat puede realizar esta acción',
      );
    }

    const chatIntegrants = await this.userService.getManyUsers(
      {
        chatIDs: { has: chatId },
      },
      { username: true, chatIDs: true },
    );

    try {
      const [deletedChat] = await this.prisma.$transaction(
        [
          this.prisma.chat.delete({ where: { id: chatId } }),
          chatIntegrants.map((user) =>
            this.prisma.user.update({
              where: { username: user.username },
              data: { chats: { disconnect: { id: chatId } } },
            }),
          ),
        ].flat(),
      );

      return deletedChat;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al eliminar el chat');
    }
  }
}

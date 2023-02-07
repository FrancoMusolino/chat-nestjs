import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { convertDateToArgTZ } from 'src/.shared/helpers';
import { UsersService } from 'src/auth/users/users.service';
import {
  ExtendedCreateChatDto,
  AddIntegrantToChatDto,
  UpdateChatDto,
  PushOutFromChatDto,
} from './dtos';
import { ExtendedCreateMessageDto } from './messages/dtos';
import { MessagesService } from './messages/messages.service';

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
        users: { select: { id: true, username: true, avatar: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async createChat({ createdBy, title }: ExtendedCreateChatDto) {
    const createdAt = convertDateToArgTZ(new Date());

    try {
      return await this.prisma.chat.create({
        data: {
          title,
          createdAt,
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

  async updateChat(chatId: string, { title }: UpdateChatDto) {
    await this.getFirstChatOrThrow({ id: chatId }).catch((error) => {
      console.log(error);
      throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
    });

    try {
      return await this.prisma.chat.update({
        where: { id: chatId },
        data: { title },
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

    const usersUpdatedChatIDs = chatIntegrants.map((integrant) => ({
      ...integrant,
      chatIDs: integrant.chatIDs.filter((id) => id !== chatId),
    }));

    try {
      const [deletedChat] = await this.prisma.$transaction(
        [
          this.prisma.chat.delete({ where: { id: chatId } }),
          usersUpdatedChatIDs.map((user) =>
            this.prisma.user.update({
              where: { username: user.username },
              data: { chatIDs: user.chatIDs },
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

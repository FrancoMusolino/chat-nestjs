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
} from './dtos';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async getFirstChatOrThrow(where: Prisma.ChatWhereUniqueInput) {
    return this.prisma.chat.findFirstOrThrow({
      where,
    });
  }

  async createChat(newChat: ExtendedCreateChatDto) {
    const createdAt = convertDateToArgTZ(new Date());
    const { createdBy, title, userIDs } = newChat;

    try {
      return await this.prisma.chat.create({
        data: { title, createdAt, createdBy, userIDs },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al crear el chat');
    }
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
          userIDs: { push: user.id },
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
        return await this.prisma.chat.delete({ where: { id: chatId } });
      }

      return await this.prisma.chat.update({
        where: { id: chatId },
        data: { userIDs: newChatIntegrants },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al abandonar el chat');
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

    try {
      return await this.prisma.chat.delete({ where: { id: chatId } });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al eliminar el chat');
    }
  }
}

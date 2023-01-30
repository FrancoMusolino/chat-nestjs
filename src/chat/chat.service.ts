import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from 'src/prisma.service';
import { convertDateToArgTZ } from 'src/.shared/helpers';
import { ExtendedCreateChatDto } from './dtos/createChat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getFirstChatOrThrow(where: Prisma.ChatWhereUniqueInput) {
    return this.prisma.chat.findFirstOrThrow({
      where,
    });
  }

  async createChat(newChat: ExtendedCreateChatDto) {
    const createdAt = convertDateToArgTZ(new Date());
    const { createdBy, title, userIDs } = newChat;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const chat = await tx.chat.create({
          data: { title, createdAt, createdBy, userIDs },
        });

        await tx.user.update({
          where: { username: createdBy },
          data: { chatIDs: { push: chat.id } },
        });

        return chat;
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al crear el chat');
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

    if (!chat.userIDs.includes(userId)) {
      throw new ConflictException('Chat inexistente');
    }

    const newChatIntegrants = chat.userIDs.filter((id) => id !== userId);

    const newUserChats = user.chatIDs.filter((id) => id !== chatId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (!newChatIntegrants.length) {
          await tx.chat.delete({ where: { id: chatId } });
        } else {
          await tx.chat.update({
            where: { id: chatId },
            data: { userIDs: newChatIntegrants },
          });
        }

        await tx.user.update({
          where: { id: userId },
          data: { chatIDs: newUserChats },
        });

        return chat;
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al abandonar el chat');
    }
  }
}

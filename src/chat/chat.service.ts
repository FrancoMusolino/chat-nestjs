import { Injectable, ConflictException } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { ExtendedCreateChatDto } from './dtos/createChat.dto';
import { convertDateToArgTZ } from 'src/.shared/helpers';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

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
}

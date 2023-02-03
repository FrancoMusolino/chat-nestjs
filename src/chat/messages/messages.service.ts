import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { ExtendedCreateMessageDto } from './dtos';
import { convertDateToArgTZ } from 'src/.shared/helpers';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage({ content, userId, chatId }: ExtendedCreateMessageDto) {
    const createdAt = convertDateToArgTZ(new Date());

    try {
      return this.prisma.message.create({
        data: {
          content,
          createdAt,
          chat: { connect: { id: chatId } },
          user: { connect: { id: userId } },
        },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al crear el mensaje');
    }
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { ExtendedCreateMessageDto } from './dtos';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFirstMessageOrThrow(where: Prisma.MessageWhereUniqueInput) {
    return await this.prisma.message.findFirstOrThrow({ where });
  }

  async createMessage({ content, userId, chatId }: ExtendedCreateMessageDto) {
    try {
      return this.prisma.message.create({
        data: {
          content,
          chat: { connect: { id: chatId } },
          user: { connect: { id: userId } },
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al crear el mensaje');
    }
  }

  async deleteMessage(messageId: string, user: User) {
    const message = await this.getFirstMessageOrThrow({ id: messageId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(
          `Mensaje con id ${messageId} no encontrado`,
        );
      },
    );

    if (message.userId !== user.id) {
      throw new UnauthorizedException(
        'Solo el creador del mensaje puede eliminarlo',
      );
    }

    if (message.deleted) {
      throw new ConflictException('El mensaje ya fue eliminado');
    }

    try {
      return await this.prisma.message.delete({ where: { id: messageId } });
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al eliminar el mensaje');
    }
  }
}

import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { TriggerRecipientsTypeEnum } from '@novu/shared';

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
import { NotificationService } from 'src/notification/notification.service';
import { NotificationTypes } from 'src/notification/notificationTypes.enum';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { QueryFilter } from 'src/.shared/types';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly messageService: MessagesService,
    private readonly notification: NotificationService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async getFirstChatOrThrow(where: Prisma.ChatWhereUniqueInput) {
    return await this.prisma.chat.findFirstOrThrow({
      where,
    });
  }

  async getChat(
    where: Prisma.ChatWhereUniqueInput,
    include?: Prisma.ChatInclude,
  ) {
    return await this.prisma.chat.findUnique({
      where,
      include,
    });
  }

  async getChatMessages(
    where: Prisma.ChatWhereUniqueInput,
    take?: number,
    skip?: number,
  ) {
    const filter: QueryFilter = {};

    const queryWithFilter = !isNaN(take) && !isNaN(skip);

    if (queryWithFilter) {
      filter.take = take;
      filter.skip = skip;
    }

    const chat = await this.prisma.chat.findUnique({
      where,
      select: {
        _count: {
          select: {
            messages: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          ...filter,
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

    const {
      _count: { messages },
      ...rest
    } = chat;

    return {
      ...rest,
      hasNextPage: queryWithFilter ? messages > skip + take : false,
    };
  }

  async getChatIntegrants(where: Prisma.ChatWhereUniqueInput) {
    const chat = await this.prisma.chat.findUnique({
      where,
      select: {
        createdBy: true,
        users: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            status: true,
            connected: true,
            lastConnection: true,
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
      const createdChat = await this.prisma.chat.create({
        data: {
          title,
          description,
          avatar,
          createdBy,
          users: { connect: { username: createdBy } },
        },
      });

      const user = await this.userService.getUser(
        { username: createdBy },
        { chats: false, messages: false },
      );

      this.notification.createTopic(
        {
          key: `chat-${createdChat.id}`,
          name: `Chat ${createdChat.id} messages notifications`,
        },
        user.id,
      );

      return createdChat;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al crear el chat');
    }
  }

  async submitMessage({ chatId, ...message }: ExtendedCreateMessageDto) {
    const chat = await this.getFirstChatOrThrow({ id: chatId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
      },
    );

    await this.updateChat(chatId, {
      lastMessageSendingAt: DateTime.now().date,
    });

    const newMessage = await this.messageService.createMessage({
      chatId,
      ...message,
    });

    const { content } = newMessage;

    const slicedContent = content.slice(0, 25);

    this.notification.notificationTrigger(NotificationTypes.MESSAGE_SENDED, {
      to: [
        { type: TriggerRecipientsTypeEnum.TOPIC, topicKey: `chat-${chatId}` },
      ],
      payload: {
        chatName: chat.title,
        chatId: chat.id,
        username: newMessage.user.username,
        content: content.length > 25 ? `${slicedContent}...` : slicedContent,
      },
      actor: {
        subscriberId: newMessage.user.id,
      },
    });

    return newMessage;
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
      const updatedChat = await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          users: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      this.notification.notificationTrigger(
        NotificationTypes.NEW_CHAT_INTEGRANT,
        {
          to: { subscriberId: user.id },
          payload: { chatId, chatName: updatedChat.title },
        },
      );

      this.notification.addSubscriberToTopic(`chat-${updatedChat.id}`, {
        subscribers: [user.id],
      });

      return updatedChat;
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
      this.notification.removeSubscribersFromTopic(`chat-${chatId}`, {
        subscribers: [userId],
      });

      if (!newChatIntegrants.length) {
        const newUserChats = user.chatIDs.filter((id) => id !== chatId);

        const [chat] = await this.prisma.$transaction([
          this.prisma.chat.delete({ where: { id: chatId } }),
          this.prisma.user.update({
            where: { id: userId },
            data: { chatIDs: newUserChats },
          }),
        ]);

        if (chat.avatar) await this.cloudinary.deleteAsset(chat.avatar);

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
      const updatedChat = await this.prisma.chat.update({
        where: { id: chatId },
        data: { users: { disconnect: { username: userToPushOut.username } } },
      });

      this.notification.notificationTrigger(
        NotificationTypes.PUSHED_OUT_FROM_CHAT,
        {
          to: { subscriberId: userToPushOut.id },
          payload: { chatName: updatedChat.title },
        },
      );

      this.notification.removeSubscribersFromTopic(`chat-${chatId}`, {
        subscribers: [userToPushOut.id],
      });

      return updatedChat;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al expulsar del chat');
    }
  }

  async updateChat(chatId: string, data: UpdateChatDto) {
    const chat = await this.getFirstChatOrThrow({ id: chatId }).catch(
      (error) => {
        console.log(error);
        throw new NotFoundException(`Chat con id ${chatId} no encontrado`);
      },
    );

    try {
      const updatedChat = await this.prisma.chat.update({
        where: { id: chatId },
        data,
      });

      if (data.avatar && chat.avatar) {
        this.cloudinary.deleteAsset(chat.avatar);
      }

      return updatedChat;
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

      if (chat.avatar) await this.cloudinary.deleteAsset(chat.avatar);

      this.notification.removeSubscribersFromTopic(`chat-${chatId}`, {
        subscribers: chatIntegrants.map((integrant) => integrant.id),
      });

      return deletedChat;
    } catch (error) {
      console.log(error);
      throw new ConflictException('Error al eliminar el chat');
    }
  }
}

import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { DateTime } from './.shared/helpers';
import { BcryptService } from './auth/bcrypt/bcrypt.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly bcrypt: BcryptService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      const { action, model, args } = params;
      const isCreateUser = model === 'User' && action === 'create';

      if (isCreateUser) {
        const user = args.data;
        const hashedPassword = await this.bcrypt.useHash(user.password);

        args.data = { ...user, password: hashedPassword };
      }

      return next(params);
    });

    this.$use(async (params, next) => {
      const { action, model, args } = params;

      const isDeleteOne = action === 'delete';

      const isDeleteUser = model === 'User' && isDeleteOne;
      const isDeleteChat = model === 'Chat' && isDeleteOne;
      const isDeleteMessage = model === 'Message' && isDeleteOne;

      if (isDeleteUser || isDeleteMessage) {
        params.action = 'update';

        const additionalData = isDeleteUser
          ? { chatIDs: [] }
          : { content: 'Mensaje eliminado' };

        params.args['data'] = {
          deleted: true,
          deletedAt: DateTime.now().date,
          ...additionalData,
        };
      }

      if (isDeleteChat) {
        const { id } = args.where;

        await this.message.deleteMany({ where: { chatId: id } });
      }

      return next(params);
    });
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

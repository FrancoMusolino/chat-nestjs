import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { genSalt, hash } from 'bcrypt';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      const { action, model, args } = params;
      const isCreateUser = model === 'User' && action === 'create';

      if (isCreateUser) {
        const user = args.data;
        const salt = await genSalt(10);
        const hashedPassword = await hash(user.password, salt);

        args.data = { ...user, password: hashedPassword };
      }

      return next(params);
    });

    this.$use(async (params, next) => {
      const { action, model, args } = params;
      const isDeleteChat = model === 'Chat' && action === 'delete';

      if (isDeleteChat) {
        const { id } = args.where;

        await this.message.deleteMany({ where: { chatId: id } });
      }

      return next(params);
    });

    this.$use(async (params, next) => {
      const { action, model } = params;
      const isDeleteMessage = model === 'Message' && action === 'delete';

      if (isDeleteMessage) {
        params.action = 'update';
        params.args['data'] = { deleted: true, content: 'Mensaje eliminado' };
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

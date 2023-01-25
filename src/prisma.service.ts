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

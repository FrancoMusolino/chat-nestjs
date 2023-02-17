import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { SocketIoAdapter } from './socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(morgan('tiny'));
  app.use(helmet());

  app.useWebSocketAdapter(new SocketIoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

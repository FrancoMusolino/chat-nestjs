import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(morgan('tiny'));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

import { Module } from '@nestjs/common';

import { BcryptService } from '../bcrypt/bcrypt.service';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, BcryptService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

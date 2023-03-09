import { Module } from '@nestjs/common';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, BcryptService, CloudinaryService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

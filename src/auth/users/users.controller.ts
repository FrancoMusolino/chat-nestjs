import { Body, Controller, Post } from '@nestjs/common';

import { CreateUserDto } from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  async create(@Body() user: CreateUserDto) {
    return await this.userService.createUser(user);
  }
}

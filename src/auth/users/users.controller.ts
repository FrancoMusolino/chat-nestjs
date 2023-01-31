import { Body, Controller, Post, Get, Param, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './../guards';

import { CreateUserDto } from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':ID')
  async getUser(@Param('ID') id: string) {
    return await this.userService.getUser({ id }, { chats: true });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() user: CreateUserDto) {
    return await this.userService.createUser(user);
  }
}

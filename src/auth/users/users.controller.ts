import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './../guards/auth.guard';

import { CreateUserDto } from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() user: CreateUserDto) {
    return await this.userService.createUser(user);
  }
}

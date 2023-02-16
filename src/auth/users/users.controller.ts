import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ValidationObjectIdPipe } from 'src/.shared/pipes';

import { JwtAuthGuard } from './../guards';

import { CreateUserDto, UpdateUserDto } from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':ID')
  async getUser(@Param('ID') id: string) {
    return await this.userService.getUser({ id });
  }

  // @UseGuards(JwtAuthGuard)
  // @Post()
  // async create(@Body() newUser: CreateUserDto) {
  //   return await this.userService.createUser(newUser);
  // }

  @UseGuards(JwtAuthGuard)
  @Patch(':ID')
  async updateUser(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() updatedUser: UpdateUserDto,
  ) {
    return await this.userService.updateUser({ id }, updatedUser);
  }
}

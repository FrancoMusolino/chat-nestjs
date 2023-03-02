import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ValidationObjectIdPipe } from 'src/.shared/pipes';

import { JwtAuthGuard } from './../guards';

import { DeleteUserDto, UpdateUserDto } from './dtos';
import { UserAuthorizationGuard } from './guards';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':ID')
  async getUser(@Param('ID', ValidationObjectIdPipe) id: string) {
    return await this.userService.getUser({ id });
  }

  @UseGuards(JwtAuthGuard, UserAuthorizationGuard)
  @Get(':ID/chats')
  async getUserChats(@Param('ID', ValidationObjectIdPipe) id: string) {
    return await this.userService.getUserChats({ id });
  }

  @UseGuards(JwtAuthGuard, UserAuthorizationGuard)
  @Patch(':ID')
  async updateUser(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() updatedUser: UpdateUserDto,
  ) {
    return await this.userService.updateUser({ id }, updatedUser);
  }

  @UseGuards(JwtAuthGuard, UserAuthorizationGuard)
  @Delete(':ID')
  async deleteUser(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Body() data: DeleteUserDto,
  ) {
    return await this.userService.deleteUser(id, data);
  }
}

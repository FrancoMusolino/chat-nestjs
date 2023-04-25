import { Controller, Body, Post, HttpCode } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }
}

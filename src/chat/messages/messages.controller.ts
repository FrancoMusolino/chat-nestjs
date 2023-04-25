import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';

import { ValidationObjectIdPipe } from 'src/.shared/pipes';
import { JwtAuthGuard } from 'src/auth/guards';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Delete(':ID')
  async deleteMessage(
    @Param('ID', ValidationObjectIdPipe) id: string,
    @Req() req: any,
  ) {
    const { user } = req;

    return await this.messageService.deleteMessage(id, user);
  }
}

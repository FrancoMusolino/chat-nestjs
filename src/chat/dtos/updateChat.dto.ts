import { PartialType } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

import { CreateChatDto } from './createChat.dto';

export class UpdateChatDto extends PartialType(CreateChatDto) {
  @IsOptional()
  title?: string;

  @IsOptional()
  @IsDate({ message: 'lastMessageSendingAt debe ser de tipo Date' })
  lastMessageSendingAt?: Date;
}

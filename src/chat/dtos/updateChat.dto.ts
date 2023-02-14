import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { CreateChatDto } from './createChat.dto';

export class UpdateChatDto extends PartialType(CreateChatDto) {
  @IsOptional()
  title?: string;
}

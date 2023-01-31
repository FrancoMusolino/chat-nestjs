import { PartialType } from '@nestjs/swagger';

import { CreateChatDto } from './createChat.dto';

export class UpdateChatDto extends PartialType(CreateChatDto) {}

import { IntersectionType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'content es un campo obligatorio' })
  @IsString({ message: 'content debe ser un string' })
  content: string;
}

class AdditionalMessageInfo {
  @IsNotEmpty({ message: 'userId es un campo obligatorio' })
  @IsMongoId({ message: 'userId debe tener el formato de un MongoId' })
  userId: string;

  @IsNotEmpty({ message: 'chatId es un campo obligatorio' })
  @IsMongoId({ message: 'chatId debe tener el formato de un MongoId' })
  chatId: string;
}

export class ExtendedCreateMessageDto extends IntersectionType(
  CreateMessageDto,
  AdditionalMessageInfo,
) {}

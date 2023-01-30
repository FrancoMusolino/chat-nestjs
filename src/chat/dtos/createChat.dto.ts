import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/swagger';

export class CreateChatDto {
  @IsNotEmpty({ message: 'title es un campo obligatorio' })
  @IsString({ message: 'title debe ser un string' })
  title: string;
}

class AdditionalChatInfo {
  @IsNotEmpty({ message: 'createdBy es un campo obligatorio' })
  @IsString({ message: 'createdBy debe ser un string' })
  createdBy: string;

  @IsArray({ message: 'userIDs debe ser un string' })
  @ArrayNotEmpty({ message: 'userIDs no puede estar vacío' })
  userIDs: string[];
}

export class ExtendedCreateChatDto extends IntersectionType(
  CreateChatDto,
  AdditionalChatInfo,
) {}

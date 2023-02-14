import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/swagger';

export class CreateChatDto {
  @IsNotEmpty({ message: 'title es un campo obligatorio' })
  @IsString({ message: 'title debe ser un string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'description debe ser un string' })
  description?: string;
}

class AdditionalChatInfo {
  @IsNotEmpty({ message: 'createdBy es un campo obligatorio' })
  @IsString({ message: 'createdBy debe ser un string' })
  createdBy: string;
}

export class ExtendedCreateChatDto extends IntersectionType(
  CreateChatDto,
  AdditionalChatInfo,
) {}

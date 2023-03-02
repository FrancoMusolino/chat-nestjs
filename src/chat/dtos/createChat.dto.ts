import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { IntersectionType } from '@nestjs/swagger';

export class CreateChatDto {
  @IsNotEmpty({ message: 'title es un campo obligatorio' })
  @IsString({ message: 'title debe ser un string' })
  @MaxLength(35, { message: 'title no puede tener más de 35 caracteres' })
  title: string;

  @IsOptional()
  @IsString({ message: 'description debe ser un string' })
  @MaxLength(255, {
    message: 'description no puede tener más de 35 caracteres',
  })
  description?: string;

  @IsOptional()
  @IsUrl(
    { protocols: ['https'] },
    { message: 'avatar debe ser una URL con protocolo https' },
  )
  avatar?: string;
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

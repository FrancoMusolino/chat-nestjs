import { IsNotEmpty, IsString } from 'class-validator';

export class AddIntegrantToChatDto {
  @IsNotEmpty({ message: 'username es un campo obligatorio' })
  @IsString({ message: 'username debe ser un string' })
  username: string;
}

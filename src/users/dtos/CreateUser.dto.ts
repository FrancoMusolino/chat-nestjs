import { MinLength, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'username debe ser un string' })
  @MinLength(3, {
    message: 'username debe ser de 3 caracteres mínimo',
  })
  username: string;
}

import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'username es un campo obligatorio' })
  @IsString({ message: 'username debe ser un string' })
  username: string;

  @IsNotEmpty({ message: 'password es un campo obligatorio' })
  @IsString({ message: 'password debe ser un string' })
  password: string;
}

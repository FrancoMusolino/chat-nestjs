import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsNotEmpty({ message: 'password es un campo obligatorio' })
  @IsString({ message: 'password debe ser un string' })
  password: string;
}

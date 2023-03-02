import {
  IsString,
  Length,
  Matches,
  IsUrl,
  IsOptional,
  MaxLength,
} from 'class-validator';

import { passwordRegExp } from 'src/.shared/utils';

export class CreateUserDto {
  @IsString({ message: 'username debe ser un string' })
  @Length(3, 15, {
    message: 'username debe tener entre 3 y 15 caracteres',
  })
  username: string;

  @IsString({ message: 'password debe ser un string' })
  @Matches(passwordRegExp, {
    message:
      'La contraseña no cumple con los requisitos mínimos | ["Al menos 6 caracteres", "Una minúscula", "Una mayúscula", "Un número"]',
  })
  password: string;

  @IsOptional()
  @IsUrl(
    { protocols: ['https'] },
    { message: 'profilePicture debe ser una URL con protocolo https' },
  )
  profilePicture?: string;

  @IsOptional()
  @IsString({ message: 'status debe ser un string' })
  @MaxLength(150, { message: 'Máximo de 150 caracteres' })
  status?: string;
}

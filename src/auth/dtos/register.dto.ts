import { IsString, Length, Matches } from 'class-validator';

import { passwordRegExp } from 'src/.shared/utils';

export class RegisterDto {
  @IsString({ message: 'username debe ser un string' })
  @Length(3, 15, {
    message: 'username debe tener entre 3 y 12 caracteres',
  })
  username: string;

  @IsString({ message: 'password debe ser un string' })
  @Matches(passwordRegExp, {
    message:
      'La contraseña no cumple con los requisitos mínimos | ["Al menos 6 caracteres", "Una minúscula", "Una mayúscula", "Un número"]',
  })
  password: string;
}

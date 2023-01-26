import { IsString, Length, Matches, IsUrl, IsOptional } from 'class-validator';

import { passwordRegExp } from 'src/.shared/utils';

export class CreateUserDto {
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

  @IsOptional()
  @IsUrl(
    { protocols: ['https'] },
    { message: 'Debe ser una URL con protocolo https' },
  )
  avatar?: string;
}

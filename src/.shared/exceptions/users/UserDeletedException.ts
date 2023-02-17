import { ConflictException, HttpStatus } from '@nestjs/common';

export class UserDeletedException extends ConflictException {
  constructor(username: string) {
    super({
      message: `El usario ${username} ha sido eliminado`,
      status: HttpStatus.CONFLICT,
    });
  }
}

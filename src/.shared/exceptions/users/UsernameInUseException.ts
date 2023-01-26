import { ConflictException, HttpStatus } from '@nestjs/common';

export class UsernameInUseException extends ConflictException {
  constructor(username: string) {
    super({
      message: `El username ${username} ya se encuentra en uso`,
      status: HttpStatus.CONFLICT,
    });
  }
}

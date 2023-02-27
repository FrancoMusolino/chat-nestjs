import { ConflictException, HttpStatus } from '@nestjs/common';

export class UsernameInUseException extends ConflictException {
  constructor(username: string) {
    super({
      message: `El username ${username} ya se encuentra en uso`,
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
    });
  }
}

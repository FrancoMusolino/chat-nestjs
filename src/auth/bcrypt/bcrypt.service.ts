import { Injectable } from '@nestjs/common';
import { genSalt, hash, compare } from 'bcrypt';

@Injectable()
export class BcryptService {
  private async generateSalt(rounds: number): Promise<string> {
    return await genSalt(rounds);
  }

  async useHash(data: string): Promise<string> {
    const salt = await this.generateSalt(10);
    return await hash(data, salt);
  }

  async validate(value: string, hashedValue: string): Promise<boolean> {
    return await compare(value, hashedValue);
  }
}

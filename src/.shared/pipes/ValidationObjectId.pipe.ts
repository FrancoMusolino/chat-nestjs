import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isMongoId } from 'class-validator';

@Injectable()
export class ValidationObjectIdPipe implements PipeTransform {
  transform(value: any) {
    if (!isMongoId(value)) {
      throw new BadRequestException('El formato del ID es inválido');
    }

    return value;
  }
}

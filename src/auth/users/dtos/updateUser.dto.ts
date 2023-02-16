import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

import { CreateUserDto } from './createUser.dto';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['avatar', 'status'] as const),
) {}

export class ExtendedUpdateUserDto extends UpdateUserDto {
  @IsOptional()
  @IsBoolean({ message: 'connected debe ser un boolean' })
  connected?: boolean;

  @IsOptional()
  @IsDateString(
    { strict: true },
    {
      message:
        'lastConnection debe ser un string con formato de fecha (incluido hora)',
    },
  )
  lastConnection?: string;
}

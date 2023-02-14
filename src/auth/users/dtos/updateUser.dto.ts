import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

import { CreateUserDto } from './createUser.dto';

class UpdateUserDto {
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

export class ExtendedUpdateUserDto extends IntersectionType(
  PartialType(PickType(CreateUserDto, ['avatar'] as const)),
  UpdateUserDto,
) {}

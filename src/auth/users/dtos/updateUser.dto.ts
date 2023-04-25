import { PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsDateString, IsOptional } from 'class-validator';

import { CreateUserDto } from './createUser.dto';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['profilePicture', 'status'] as const),
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

  @IsOptional()
  @IsBoolean({ message: 'deleted debe ser un boolean' })
  deleted?: boolean;

  @IsOptional()
  @IsDate({ message: 'deletedAt debe ser un Date' })
  deletedAt?: Date | null;
}

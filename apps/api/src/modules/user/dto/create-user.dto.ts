import { Role } from '@prisma/client'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator'

export class CreateUserDto {
  @IsEnum(Role)
  role!: Role

  @IsString()
  @Length(2, 120)
  name!: string

  @ValidateIf((value: CreateUserDto) => value.role === Role.SUPER_ADMIN)
  @IsEmail()
  @IsNotEmpty()
  @Length(5, 150)
  email?: string

  @ValidateIf((value: CreateUserDto) => value.role === Role.USER)
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  employeeId?: string

  @IsString()
  @Length(8, 72)
  password!: string
}

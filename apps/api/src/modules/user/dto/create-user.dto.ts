import { IsString, Length } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @Length(3, 120)
  email!: string

  @IsString()
  @Length(8, 72)
  password!: string
}

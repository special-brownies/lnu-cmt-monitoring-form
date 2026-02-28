import { IsEmail, IsString, Length } from 'class-validator'

export class AdminLoginDto {
  @IsEmail()
  @Length(5, 150)
  email!: string

  @IsString()
  @Length(8, 72)
  password!: string
}

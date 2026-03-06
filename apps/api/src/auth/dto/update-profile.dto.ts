import { IsEmail, IsOptional, IsString, Length } from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @IsOptional()
  @IsEmail()
  @Length(5, 150)
  email?: string
}

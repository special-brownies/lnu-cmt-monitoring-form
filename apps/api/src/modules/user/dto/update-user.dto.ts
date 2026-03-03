import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @IsOptional()
  @IsEmail()
  @Length(5, 150)
  email?: string

  @IsOptional()
  @IsString()
  @Length(8, 72)
  password?: string

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'Active', 'Inactive'])
  status?: string
}

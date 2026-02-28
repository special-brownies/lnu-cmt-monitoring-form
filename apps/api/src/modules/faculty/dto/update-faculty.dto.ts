import { IsOptional, IsString, Length } from 'class-validator'

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @IsOptional()
  @IsString()
  @Length(3, 50)
  employeeId?: string

  @IsOptional()
  @IsString()
  @Length(8, 72)
  password?: string
}

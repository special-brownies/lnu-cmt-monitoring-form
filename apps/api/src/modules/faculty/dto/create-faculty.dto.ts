import { IsNotEmpty, IsString, Length } from 'class-validator'

export class CreateFacultyDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name!: string

  @IsString()
  @Length(3, 50)
  employeeId!: string

  @IsString()
  @Length(8, 72)
  password!: string
}

import { IsString, Length } from 'class-validator'

export class FacultyLoginDto {
  @IsString()
  @Length(3, 50)
  employeeId!: string

  @IsString()
  @Length(8, 72)
  password!: string
}

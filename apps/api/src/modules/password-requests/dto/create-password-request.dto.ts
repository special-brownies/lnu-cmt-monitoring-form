import { IsString, Length } from 'class-validator'

export class CreatePasswordRequestDto {
  @IsString()
  @Length(3, 50)
  employeeId!: string
}

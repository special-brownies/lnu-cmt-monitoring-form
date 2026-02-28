import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class CreateFacultyDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string
}

import { IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string
}

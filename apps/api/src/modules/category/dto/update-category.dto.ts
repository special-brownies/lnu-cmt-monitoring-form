import { IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string
}

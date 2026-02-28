import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string
}

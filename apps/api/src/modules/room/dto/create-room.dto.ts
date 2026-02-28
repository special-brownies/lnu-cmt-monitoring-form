import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string
}
